import os
import json
from backend.app.ml_engine.report_generator import generate_pdf_report, generate_json_report
from backend.app.config import settings

def test_report_generation():
    sample_exp = {
        "id": "exp-test-12345",
        "name": "SmolLM2 Instruction Tuning Test",
        "base_model": "HuggingFaceTB/SmolLM2-360M-Instruct",
        "dataset_name": "Academic-Reasoning-Sample",
        "status": "COMPLETED",
        "training_duration_sec": 42.5,
        "config": {
            "epochs": 1,
            "learning_rate": 0.0003,
            "batch_size": 1,
            "gradient_accumulation_steps": 4,
            "max_seq_length": 128,
            "lora_r": 8,
            "lora_alpha": 16,
            "lora_dropout": 0.05
        },
        "train_loss": 1.234,
        "val_loss": 1.150,
        "loss_history": [
            {"step": 1, "epoch": 1, "loss": 2.45, "val_loss": 2.30, "elapsed_sec": 10.2},
            {"step": 2, "epoch": 1, "loss": 1.85, "val_loss": 1.70, "elapsed_sec": 21.4},
            {"step": 3, "epoch": 1, "loss": 1.45, "val_loss": 1.35, "elapsed_sec": 32.1},
            {"step": 4, "epoch": 1, "loss": 1.23, "val_loss": 1.15, "elapsed_sec": 42.5}
        ],
        "evaluation_metrics": {
            "perplexity": 3.45,
            "rouge1": 0.62,
            "rouge2": 0.41,
            "rougeL": 0.58,
            "token_f1": 0.65,
            "exact_match": 0.20
        }
    }

    pdf_path = os.path.join(settings.REPORT_DIR, "test_report.pdf")
    json_path = os.path.join(settings.REPORT_DIR, "test_report.json")

    out_pdf = generate_pdf_report(sample_exp, pdf_path)
    assert os.path.exists(out_pdf)
    assert os.path.getsize(out_pdf) > 1000

    out_json = generate_json_report(sample_exp, json_path)
    assert os.path.exists(out_json)
    with open(out_json, "r") as f:
        data = json.load(f)
        assert data["report_metadata"]["platform"] == "NEXORA"
        assert data["experiment"]["id"] == "exp-test-12345"

    print("PDF and JSON reports successfully generated and verified!")
