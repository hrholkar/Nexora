import os
import time
import threading
import torch
from typing import Optional, List, Dict, Any, Generator
from transformers import TextIteratorStreamer, AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
from backend.app.ml_engine.model_hub import ACTIVE_MODEL_CONTAINER, load_model_into_memory, get_model_path, is_model_downloaded
from backend.app.ml_engine.tokenizer_util import format_prompt

def run_inference(
    model_name: str,
    prompt: Optional[str] = None,
    messages: Optional[List[Dict[str, str]]] = None,
    system_prompt: Optional[str] = "You are NEXORA, a helpful, precise AI assistant.",
    adapter_path: Optional[str] = None,
    temperature: float = 0.7,
    top_p: float = 0.9,
    top_k: int = 50,
    max_new_tokens: int = 128,
    repetition_penalty: float = 1.1
) -> Dict[str, Any]:
    """Performs genuine model inference on CPU or CUDA, with optional LoRA adapter."""
    # Ensure base model is loaded
    if ACTIVE_MODEL_CONTAINER["model"] is None or ACTIVE_MODEL_CONTAINER["model_name"] != model_name:
        load_model_into_memory(model_name)

    base_model = ACTIVE_MODEL_CONTAINER["model"]
    tokenizer = ACTIVE_MODEL_CONTAINER["tokenizer"]
    device = ACTIVE_MODEL_CONTAINER["device"]

    # If LoRA adapter is requested, wrap base model with PeftModel
    inference_model = base_model
    adapter_loaded = None
    if adapter_path and os.path.exists(adapter_path):
        try:
            inference_model = PeftModel.from_pretrained(base_model, adapter_path)
            adapter_loaded = adapter_path
        except Exception:
            inference_model = base_model

    formatted_input = format_prompt(tokenizer, prompt=prompt, messages=messages, system_prompt=system_prompt)
    if not formatted_input:
        return {
            "generated_text": "",
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0,
            "latency_ms": 0.0,
            "model_name": model_name,
            "adapter_used": adapter_loaded
        }

    inputs = tokenizer(formatted_input, return_tensors="pt").to(device)
    prompt_token_count = inputs["input_ids"].shape[1]

    do_sample = temperature > 0.05
    gen_kwargs = {
        "max_new_tokens": max_new_tokens,
        "pad_token_id": tokenizer.pad_token_id or tokenizer.eos_token_id,
        "eos_token_id": tokenizer.eos_token_id,
        "repetition_penalty": repetition_penalty,
    }
    if do_sample:
        gen_kwargs["do_sample"] = True
        gen_kwargs["temperature"] = max(temperature, 0.01)
        gen_kwargs["top_p"] = top_p
        gen_kwargs["top_k"] = top_k
    else:
        gen_kwargs["do_sample"] = False

    start_time = time.time()
    with torch.no_grad():
        output_ids = inference_model.generate(**inputs, **gen_kwargs)
    latency_ms = round((time.time() - start_time) * 1000, 2)

    generated_tokens = output_ids[0][prompt_token_count:]
    completion_token_count = len(generated_tokens)
    generated_text = tokenizer.decode(generated_tokens, skip_special_tokens=True).strip()

    return {
        "generated_text": generated_text,
        "prompt_tokens": prompt_token_count,
        "completion_tokens": completion_token_count,
        "total_tokens": prompt_token_count + completion_token_count,
        "latency_ms": latency_ms,
        "model_name": model_name,
        "adapter_used": adapter_loaded
    }

def stream_inference(
    model_name: str,
    prompt: Optional[str] = None,
    messages: Optional[List[Dict[str, str]]] = None,
    system_prompt: Optional[str] = "You are NEXORA, a helpful, precise AI assistant.",
    adapter_path: Optional[str] = None,
    temperature: float = 0.7,
    top_p: float = 0.9,
    top_k: int = 50,
    max_new_tokens: int = 128,
    repetition_penalty: float = 1.1
) -> Generator[str, None, None]:
    """Streams generated tokens using TextIteratorStreamer."""
    if ACTIVE_MODEL_CONTAINER["model"] is None or ACTIVE_MODEL_CONTAINER["model_name"] != model_name:
        load_model_into_memory(model_name)

    base_model = ACTIVE_MODEL_CONTAINER["model"]
    tokenizer = ACTIVE_MODEL_CONTAINER["tokenizer"]
    device = ACTIVE_MODEL_CONTAINER["device"]

    inference_model = base_model
    if adapter_path and os.path.exists(adapter_path):
        try:
            inference_model = PeftModel.from_pretrained(base_model, adapter_path)
        except Exception:
            inference_model = base_model

    formatted_input = format_prompt(tokenizer, prompt=prompt, messages=messages, system_prompt=system_prompt)
    if not formatted_input:
        return

    inputs = tokenizer(formatted_input, return_tensors="pt").to(device)

    streamer = TextIteratorStreamer(tokenizer, skip_prompt=True, skip_special_tokens=True)
    do_sample = temperature > 0.05
    gen_kwargs = dict(
        inputs,
        streamer=streamer,
        max_new_tokens=max_new_tokens,
        pad_token_id=tokenizer.pad_token_id or tokenizer.eos_token_id,
        eos_token_id=tokenizer.eos_token_id,
        repetition_penalty=repetition_penalty,
    )
    if do_sample:
        gen_kwargs["do_sample"] = True
        gen_kwargs["temperature"] = max(temperature, 0.01)
        gen_kwargs["top_p"] = top_p
        gen_kwargs["top_k"] = top_k
    else:
        gen_kwargs["do_sample"] = False

    thread = threading.Thread(target=inference_model.generate, kwargs=gen_kwargs)
    thread.start()

    for new_text in streamer:
        yield new_text
