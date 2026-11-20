import psutil
from typing import Dict, Any

try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    torch = None
    TORCH_AVAILABLE = False

def get_hardware_info() -> Dict[str, Any]:
    """Detects CPU, RAM, and optional CUDA availability on the host machine."""
    vm = psutil.virtual_memory()
    total_ram_gb = round(vm.total / (1024 ** 3), 2)
    free_ram_gb = round(vm.available / (1024 ** 3), 2)
    cpu_percent = psutil.cpu_percent(interval=None)
    cpu_cores = psutil.cpu_count(logical=False) or psutil.cpu_count(logical=True)
    cpu_logical = psutil.cpu_count(logical=True)
    
    cuda_available = torch.cuda.is_available() if (TORCH_AVAILABLE and torch is not None) else False
    cuda_device_name = torch.cuda.get_device_name(0) if cuda_available else None
    cuda_vram_gb = round(torch.cuda.get_device_properties(0).total_memory / (1024 ** 3), 2) if cuda_available else 0.0

    # Determine recommended defaults based on hardware
    if cuda_available:
        recommended_batch_size = 4
        recommended_seq_len = 512
        device = "cuda"
        precision = "fp16"
    else:
        # CPU Mode
        if total_ram_gb >= 12:
            recommended_batch_size = 1
            recommended_seq_len = 256
        else:
            recommended_batch_size = 1
            recommended_seq_len = 128
        device = "cpu"
        precision = "fp32"

    return {
        "device": device,
        "cuda_available": cuda_available,
        "cuda_device_name": cuda_device_name,
        "cuda_vram_gb": cuda_vram_gb,
        "cpu_cores_physical": cpu_cores,
        "cpu_cores_logical": cpu_logical,
        "cpu_usage_percent": cpu_percent,
        "total_ram_gb": total_ram_gb,
        "free_ram_gb": free_ram_gb,
        "ram_usage_percent": vm.percent,
        "precision": precision,
        "recommended_batch_size": recommended_batch_size,
        "recommended_seq_len": recommended_seq_len,
        "recommended_grad_accum": 4
    }
