export interface ModelCard {
  id: string;
  name: string;
  hf_repo: string;
  parameters: string;
  architecture: string;
  description: string;
  license: string;
  supported_tasks: string[];
  min_ram_gb: number;
  recommended_for_cpu: boolean;
  is_downloaded: boolean;
  is_loaded: boolean;
  local_path?: string | null;
}

export interface HardwareInfo {
  device: string;
  cuda_available: boolean;
  cuda_device_name?: string | null;
  cuda_vram_gb: number;
  cpu_cores_physical: number;
  cpu_cores_logical: number;
  cpu_usage_percent: number;
  total_ram_gb: number;
  free_ram_gb: number;
  ram_usage_percent: number;
  precision: string;
  recommended_batch_size: number;
  recommended_seq_len: number;
  recommended_grad_accum: number;
}

export interface DatasetMetadata {
  id: string;
  name: string;
  filename: string;
  file_format: string;
  sample_count: number;
  column_names: string[];
  has_validation_errors: boolean;
  validation_summary: {
    total_samples?: number;
    valid_samples?: number;
    invalid_samples?: number;
    duplicates?: number;
    empty_fields?: number;
    format?: string;
    issues_sample?: Array<{ row: number; reason: string }>;
  };
  storage_path: string;
  split_train_path?: string | null;
  split_val_path?: string | null;
  created_at?: string;
}

export interface DatasetPreview {
  columns: string[];
  rows: Record<string, any>[];
  total_samples: number;
}

export interface TrainingConfig {
  model_name: string;
  dataset_id: string;
  experiment_name: string;
  epochs: number;
  learning_rate: number;
  batch_size: number;
  gradient_accumulation_steps: number;
  max_seq_length: number;
  lora_r: number;
  lora_alpha: number;
  lora_dropout: number;
  warmup_steps: number;
  weight_decay: number;
  seed: number;
}

export interface LossPoint {
  step: number;
  epoch: number;
  loss: number;
  val_loss?: number | null;
  cpu_percent?: number;
  ram_percent?: number;
  elapsed_sec?: number;
}

export interface TrainingStatus {
  experiment_id: string;
  name: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  base_model: string;
  current_epoch: number;
  total_epochs: number;
  current_step: number;
  total_steps: number;
  train_loss?: number | null;
  val_loss?: number | null;
  elapsed_sec: number;
  eta_sec?: number | null;
  cpu_percent: number;
  ram_percent: number;
  loss_history: LossPoint[];
  adapter_path?: string | null;
  error_message?: string | null;
}

export interface ExperimentSummary {
  id: string;
  name: string;
  base_model: string;
  dataset_name?: string | null;
  status: string;
  train_loss?: number | null;
  val_loss?: number | null;
  training_duration_sec: number;
  current_epoch: number;
  total_epochs: number;
  current_step: number;
  total_steps: number;
  adapter_path?: string | null;
  created_at?: string;
  completed_at?: string;
}

export interface ExperimentDetail extends ExperimentSummary {
  config: Record<string, any>;
  loss_history: LossPoint[];
  evaluation_metrics: Record<string, any>;
  error_message?: string | null;
}

export interface InferenceRequest {
  model_name: string;
  adapter_id?: string | null;
  prompt?: string;
  messages?: Array<{ role: string; content: string }>;
  system_prompt?: string;
  temperature: number;
  top_p: number;
  top_k: number;
  max_new_tokens: number;
  repetition_penalty: number;
}

export interface InferenceResponse {
  generated_text: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  model_name: string;
  adapter_used?: string | null;
}

export interface EvaluationResponse {
  id: string;
  experiment_id?: string | null;
  model_name: string;
  adapter_id?: string | null;
  dataset_name: string;
  metrics: {
    perplexity?: number;
    bleu?: number;
    rouge1?: number;
    rouge2?: number;
    rougeL?: number;
    token_f1?: number;
    exact_match?: number;
    [key: string]: any;
  };
  samples_evaluated: number;
  created_at?: string;
}

export interface ReportResponse {
  report_id: string;
  experiment_id: string;
  format: string;
  download_url: string;
  created_at: string;
}

export interface HealthStatus {
  status: string;
  app_name: string;
  tagline: string;
  version: string;
  environment: string;
  database_connected: boolean;
  ml_engine_enabled: boolean;
  active_model?: string | null;
  model_loaded: boolean;
  device: string;
}
