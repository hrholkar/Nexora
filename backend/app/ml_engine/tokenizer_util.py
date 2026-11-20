from typing import List, Dict, Any, Optional
from transformers import PreTrainedTokenizer

def format_prompt(
    tokenizer: PreTrainedTokenizer,
    prompt: Optional[str] = None,
    messages: Optional[List[Dict[str, str]]] = None,
    system_prompt: Optional[str] = "You are NEXORA, a helpful, precise AI assistant."
) -> str:
    """Formats prompt using model's chat template if available, or fallbacks cleanly."""
    if messages and len(messages) > 0:
        # Check if chat template is available
        if hasattr(tokenizer, "apply_chat_template") and tokenizer.chat_template:
            try:
                formatted = tokenizer.apply_chat_template(
                    messages,
                    tokenize=False,
                    add_generation_prompt=True
                )
                return formatted
            except Exception:
                pass
        
        # Fallback formatting for conversational
        formatted_lines = []
        if system_prompt:
            formatted_lines.append(f"System: {system_prompt}")
        for m in messages:
            role = m.get("role", "user").capitalize()
            content = m.get("content", "")
            formatted_lines.append(f"{role}: {content}")
        formatted_lines.append("Assistant:")
        return "\n\n".join(formatted_lines)
        
    # Single prompt
    if prompt:
        if hasattr(tokenizer, "apply_chat_template") and tokenizer.chat_template:
            msgs = []
            if system_prompt:
                msgs.append({"role": "system", "content": system_prompt})
            msgs.append({"role": "user", "content": prompt})
            try:
                return tokenizer.apply_chat_template(msgs, tokenize=False, add_generation_prompt=True)
            except Exception:
                pass
        
        if system_prompt:
            return f"System: {system_prompt}\n\nUser: {prompt}\n\nAssistant:"
        return f"User: {prompt}\n\nAssistant:"

    return ""
