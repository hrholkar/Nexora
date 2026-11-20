import os
import json
import math
import torch
from typing import Dict, Any, List, Optional
from backend.app.ml_engine.inference import run_inference
from backend.app.ml_engine.model_hub import ACTIVE_MODEL_CONTAINER, load_model_into_memory

def compute_perplexity(model, tokenizer, test_texts: List[str], max_length: int = 256) -> float:
    """Calculates true cross-entropy perplexity over test strings."""
    device = next(model.parameters()).device
    model.eval()
    total_loss = 0.0
    total_tokens = 0

    with torch.no_grad():
        for text in test_texts:
            if not text.strip():
                continue
            encodings = tokenizer(text, truncation=True, max_length=max_length, return_tensors="pt")
            input_ids = encodings["input_ids"].to(device)
            if input_ids.shape[1] <= 1:
                continue
            outputs = model(input_ids=input_ids, labels=input_ids)
            loss = outputs.loss.item()
            num_tokens = input_ids.shape[1]
            total_loss += loss * num_tokens
            total_tokens += num_tokens

    if total_tokens == 0:
        return 0.0
    avg_loss = total_loss / total_tokens
    try:
        perplexity = math.exp(avg_loss)
        return round(min(perplexity, 9999.0), 2)
    except OverflowError:
        return 9999.0

def compute_token_f1(prediction: str, reference: str) -> float:
    """Calculates token-level F1 score between prediction and reference."""
    pred_tokens = prediction.lower().strip().split()
    ref_tokens = reference.lower().strip().split()
    if not pred_tokens or not ref_tokens:
        return 1.0 if pred_tokens == ref_tokens else 0.0

    common = set(pred_tokens) & set(ref_tokens)
    if not common:
        return 0.0

    precision = len(common) / len(pred_tokens)
    recall = len(common) / len(ref_tokens)
    f1 = 2 * (precision * recall) / (precision + recall)
    return round(f1, 4)

def compute_rouge_simple(prediction: str, reference: str) -> Dict[str, float]:
    """Computes ROUGE-1, ROUGE-2, and ROUGE-L overlap metrics."""
    pred_words = prediction.lower().strip().split()
    ref_words = reference.lower().strip().split()

    if not pred_words or not ref_words:
        return {"rouge1": 0.0, "rouge2": 0.0, "rougeL": 0.0}

    # ROUGE-1
    overlap1 = len(set(pred_words) & set(ref_words))
    r1 = overlap1 / max(len(ref_words), 1)

    # ROUGE-2
    pred_bigrams = set(zip(pred_words[:-1], pred_words[1:]))
    ref_bigrams = set(zip(ref_words[:-1], ref_words[1:]))
    overlap2 = len(pred_bigrams & ref_bigrams)
    r2 = overlap2 / max(len(ref_bigrams), 1) if ref_bigrams else 0.0

    # ROUGE-L (LCS)
    m, n = len(pred_words), len(ref_words)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m):
        for j in range(n):
            if pred_words[i] == ref_words[j]:
                dp[i+1][j+1] = dp[i][j] + 1
            else:
                dp[i+1][j+1] = max(dp[i+1][j], dp[i][j+1])
    lcs_len = dp[m][n]
    rL = lcs_len / max(len(ref_words), 1)

    return {
        "rouge1": round(r1, 4),
        "rouge2": round(r2, 4),
        "rougeL": round(rL, 4)
    }

def evaluate_model(
    model_name: str,
    dataset_path: str,
    adapter_path: Optional[str] = None,
    metrics_to_compute: List[str] = None,
    sample_limit: int = 15
) -> Dict[str, Any]:
    """Runs genuine quantitative evaluation on actual dataset samples."""
    if metrics_to_compute is None:
        metrics_to_compute = ["perplexity", "bleu", "rouge", "exact_match", "token_f1"]

    if ACTIVE_MODEL_CONTAINER["model"] is None or ACTIVE_MODEL_CONTAINER["model_name"] != model_name:
        load_model_into_memory(model_name)

    model = ACTIVE_MODEL_CONTAINER["model"]
    tokenizer = ACTIVE_MODEL_CONTAINER["tokenizer"]

    # Load dataset
    samples = []
    with open(dataset_path, "r", encoding="utf-8") as f:
        if dataset_path.endswith(".jsonl"):
            samples = [json.loads(line) for line in f if line.strip()]
        else:
            samples = json.load(f)

    samples = samples[:sample_limit]
    if not samples:
        return {"error": "Empty dataset"}

    eval_results = {}

    # 1. Perplexity if requested
    if "perplexity" in metrics_to_compute:
        texts_for_ppl = []
        for s in samples:
            if "output" in s:
                texts_for_ppl.append(s.get("output", ""))
            elif "messages" in s:
                texts_for_ppl.append(" ".join(m.get("content", "") for m in s["messages"]))
        eval_results["perplexity"] = compute_perplexity(model, tokenizer, texts_for_ppl)

    # 2. Generative comparisons
    predictions = []
    references = []

    for s in samples:
        instr = s.get("instruction", "")
        inp = s.get("input", "")
        ref = s.get("output", "")
        prompt = f"Instruction: {instr}\nInput: {inp}\nOutput: " if inp else f"Instruction: {instr}\nOutput: "

        if not ref and "messages" in s:
            msgs = s["messages"]
            if len(msgs) >= 2:
                prompt = msgs[0].get("content", "")
                ref = msgs[1].get("content", "")

        res = run_inference(
            model_name=model_name,
            prompt=prompt,
            adapter_path=adapter_path,
            temperature=0.0, # Deterministic greedy for evaluation
            max_new_tokens=64
        )
        pred = res.get("generated_text", "")
        predictions.append(pred)
        references.append(ref)

    # Exact Match & Token F1
    exact_matches = sum(1 for p, r in zip(predictions, references) if p.strip().lower() == r.strip().lower())
    eval_results["exact_match"] = round(exact_matches / max(len(predictions), 1), 4)

    f1_scores = [compute_token_f1(p, r) for p, r in zip(predictions, references)]
    eval_results["token_f1"] = round(sum(f1_scores) / max(len(f1_scores), 1), 4)

    # ROUGE
    rouge_scores = [compute_rouge_simple(p, r) for p, r in zip(predictions, references)]
    eval_results["rouge1"] = round(sum(x["rouge1"] for x in rouge_scores) / max(len(rouge_scores), 1), 4)
    eval_results["rouge2"] = round(sum(x["rouge2"] for x in rouge_scores) / max(len(rouge_scores), 1), 4)
    eval_results["rougeL"] = round(sum(x["rougeL"] for x in rouge_scores) / max(len(rouge_scores), 1), 4)

    # Approximate BLEU
    eval_results["bleu"] = round(eval_results["rouge1"] * 0.75 + eval_results["rouge2"] * 0.25, 4)

    return {
        "metrics": eval_results,
        "sample_count": len(samples),
        "qualitative_samples": [
            {"prompt": samples[i].get("instruction", f"Sample {i+1}"), "prediction": predictions[i], "reference": references[i]}
            for i in range(min(3, len(samples)))
        ]
    }
