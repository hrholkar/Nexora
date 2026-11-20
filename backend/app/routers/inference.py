import os
import json
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.config import settings
from backend.app.models.schema import ExperimentModel
from backend.app.schemas.inference import InferenceRequest, InferenceResponse
from backend.app.ml_engine.inference import run_inference, stream_inference

router = APIRouter(prefix="/inference", tags=["LLM Playground & Inference"])

def resolve_adapter_path(adapter_id: str, db: Session) -> str:
    if not adapter_id:
        return None
    # Check if adapter_id is direct path
    if os.path.exists(adapter_id):
        return adapter_id
    # Check if adapter_id is experiment_id in DB
    exp = db.query(ExperimentModel).filter(ExperimentModel.id == adapter_id).first()
    if exp and exp.adapter_path and os.path.exists(exp.adapter_path):
        return exp.adapter_path
    # Check by path in storage/adapters
    std_path = os.path.join(settings.ADAPTER_DIR, adapter_id)
    if os.path.exists(std_path):
        return std_path
    return None

@router.post("/generate", response_model=InferenceResponse)
def generate_completion(req: InferenceRequest, db: Session = Depends(get_db)):
    if not settings.ML_ENGINE_ENABLED:
        raise HTTPException(
            status_code=400,
            detail="ML Engine is offline or running in lightweight cloud mode. Inference requires a connected local ML worker."
        )

    adapter_path = resolve_adapter_path(req.adapter_id, db) if req.adapter_id else None

    # Convert Pydantic ChatMessages to dicts if present
    messages_dict = None
    if req.messages:
        messages_dict = [{"role": m.role, "content": m.content} for m in req.messages]

    try:
        res = run_inference(
            model_name=req.model_name,
            prompt=req.prompt,
            messages=messages_dict,
            system_prompt=req.system_prompt,
            adapter_path=adapter_path,
            temperature=req.temperature,
            top_p=req.top_p,
            top_k=req.top_k,
            max_new_tokens=req.max_new_tokens,
            repetition_penalty=req.repetition_penalty
        )
        return InferenceResponse(**res)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference execution failed: {str(e)}")

@router.post("/stream")
def stream_completion(req: InferenceRequest, db: Session = Depends(get_db)):
    if not settings.ML_ENGINE_ENABLED:
        raise HTTPException(
            status_code=400,
            detail="ML Engine is offline or running in lightweight cloud mode. Inference requires a connected local ML worker."
        )

    adapter_path = resolve_adapter_path(req.adapter_id, db) if req.adapter_id else None
    messages_dict = [{"role": m.role, "content": m.content} for m in req.messages] if req.messages else None

    def event_generator():
        try:
            for token in stream_inference(
                model_name=req.model_name,
                prompt=req.prompt,
                messages=messages_dict,
                system_prompt=req.system_prompt,
                adapter_path=adapter_path,
                temperature=req.temperature,
                top_p=req.top_p,
                top_k=req.top_k,
                max_new_tokens=req.max_new_tokens,
                repetition_penalty=req.repetition_penalty
            ):
                data = json.dumps({"token": token})
                yield f"data: {data}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            err_data = json.dumps({"error": str(e)})
            yield f"data: {err_data}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
