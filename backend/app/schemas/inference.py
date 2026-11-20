from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ChatMessage(BaseModel):
    role: str # user, assistant, system
    content: str

class InferenceRequest(BaseModel):
    model_name: str
    adapter_id: Optional[str] = None # experiment ID or path to LoRA adapter
    prompt: Optional[str] = None
    messages: Optional[List[ChatMessage]] = None
    system_prompt: Optional[str] = "You are NEXORA, a helpful, precise AI assistant."
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    top_p: float = Field(default=0.9, ge=0.0, le=1.0)
    top_k: int = Field(default=50, ge=1, le=200)
    max_new_tokens: int = Field(default=128, ge=1, le=1024)
    repetition_penalty: float = Field(default=1.1, ge=1.0, le=2.0)

class InferenceResponse(BaseModel):
    generated_text: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    latency_ms: float
    model_name: str
    adapter_used: Optional[str] = None
