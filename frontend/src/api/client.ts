import axios from 'axios';
import {
  ModelCard,
  HardwareInfo,
  DatasetMetadata,
  DatasetPreview,
  TrainingConfig,
  TrainingStatus,
  ExperimentSummary,
  ExperimentDetail,
  InferenceRequest,
  InferenceResponse,
  EvaluationResponse,
  ReportResponse,
  HealthStatus
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

// System & Health
export const getHealth = async (): Promise<HealthStatus> => {
  const { data } = await api.get<HealthStatus>('/health');
  return data;
};

export const getHardwareInfo = async (): Promise<HardwareInfo> => {
  const { data } = await api.get<HardwareInfo>('/system/hardware');
  return data;
};

// Model Hub
export const getModels = async (): Promise<ModelCard[]> => {
  const { data } = await api.get<ModelCard[]>('/models');
  return data;
};

export const downloadModel = async (model_name: string) => {
  const { data } = await api.post('/models/download', { model_name });
  return data;
};

export const selectModel = async (model_name: string) => {
  const { data } = await api.post('/models/select', { model_name });
  return data;
};

export const unloadModel = async () => {
  const { data } = await api.post('/models/unload');
  return data;
};

// Dataset Studio
export const uploadDataset = async (file: File): Promise<DatasetMetadata> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<DatasetMetadata>('/datasets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const getDatasets = async (): Promise<DatasetMetadata[]> => {
  const { data } = await api.get<DatasetMetadata[]>('/datasets');
  return data;
};

export const getDatasetDetail = async (id: string): Promise<{ metadata: DatasetMetadata; preview: DatasetPreview }> => {
  const { data } = await api.get(`/datasets/${id}`);
  return data;
};

export const validateDataset = async (id: string) => {
  const { data } = await api.post(`/datasets/${id}/validate`);
  return data;
};

export const preprocessDataset = async (
  id: string,
  params: { format_type: string; remove_duplicates: boolean; drop_empty: boolean }
) => {
  const { data } = await api.post(`/datasets/${id}/preprocess`, params);
  return data;
};

export const splitDataset = async (id: string, params: { train_ratio: number; val_ratio: number; seed: number }) => {
  const { data } = await api.post(`/datasets/${id}/split`, params);
  return data;
};

export const seedSampleDatasets = async () => {
  const { data } = await api.post('/datasets/seed-samples');
  return data;
};

// Training Studio
export const startTraining = async (config: TrainingConfig) => {
  const { data } = await api.post('/training/start', config);
  return data;
};

export const getTrainingStatus = async (experiment_id: string): Promise<TrainingStatus> => {
  const { data } = await api.get<TrainingStatus>(`/training/status/${experiment_id}`);
  return data;
};

export const cancelTraining = async (experiment_id: string) => {
  const { data } = await api.post(`/training/cancel/${experiment_id}`);
  return data;
};

// Inference & Playground
export const runInference = async (req: InferenceRequest): Promise<InferenceResponse> => {
  const { data } = await api.post<InferenceResponse>('/inference/generate', req);
  return data;
};

// Evaluation
export const runEvaluation = async (req: {
  model_name: string;
  dataset_id: string;
  adapter_id?: string | null;
  experiment_id?: string | null;
  metrics: string[];
  sample_limit: number;
}): Promise<EvaluationResponse> => {
  const { data } = await api.post<EvaluationResponse>('/evaluation/run', req);
  return data;
};

export const getEvaluations = async (): Promise<EvaluationResponse[]> => {
  const { data } = await api.get<EvaluationResponse[]>('/evaluation');
  return data;
};

// Experiments
export const getExperiments = async (): Promise<ExperimentSummary[]> => {
  const { data } = await api.get<ExperimentSummary[]>('/experiments');
  return data;
};

export const getExperimentDetail = async (id: string): Promise<ExperimentDetail> => {
  const { data } = await api.get<ExperimentDetail>(`/experiments/${id}`);
  return data;
};

export const deleteExperiment = async (id: string) => {
  const { data } = await api.delete(`/experiments/${id}`);
  return data;
};

// Reports
export const generateReport = async (experiment_id: string, format: 'pdf' | 'json'): Promise<ReportResponse> => {
  const { data } = await api.post<ReportResponse>('/reports/generate', { experiment_id, format });
  return data;
};
