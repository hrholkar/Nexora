import React, { useState } from 'react';
import {
  Box,
  Download,
  CheckCircle,
  HardDrive,
  Cpu,
  Layers,
  Search,
  RefreshCw,
  Power,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { ModelCard } from '../types';
import { downloadModel, selectModel, unloadModel } from '../api/client';

interface ModelHubViewProps {
  models: ModelCard[];
  onRefreshModels: () => void;
  mlEngineOnline: boolean;
}

export const ModelHubView: React.FC<ModelHubViewProps> = ({
  models,
  onRefreshModels,
  mlEngineOnline
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTask, setFilterTask] = useState('all');
  const [loadingModel, setLoadingModel] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const filteredModels = models.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.hf_repo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.architecture.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTask =
      filterTask === 'all' || m.supported_tasks.includes(filterTask);
    return matchesSearch && matchesTask;
  });

  const handleDownload = async (repo: string) => {
    try {
      setLoadingModel(repo);
      setStatusMessage({ text: `Downloading ${repo} from Hugging Face...`, type: 'success' });
      await downloadModel(repo);
      setStatusMessage({ text: `Model ${repo} downloaded successfully!`, type: 'success' });
      onRefreshModels();
    } catch (err: any) {
      setStatusMessage({
        text: err.response?.data?.detail || `Failed to download ${repo}. Check connection.`,
        type: 'error',
      });
    } finally {
      setLoadingModel(null);
    }
  };

  const handleLoad = async (repo: string) => {
    try {
      setLoadingModel(repo);
      setStatusMessage({ text: `Loading ${repo} into memory...`, type: 'success' });
      await selectModel(repo);
      setStatusMessage({ text: `Model ${repo} loaded and ready for inference!`, type: 'success' });
      onRefreshModels();
    } catch (err: any) {
      setStatusMessage({
        text: err.response?.data?.detail || `Failed to load ${repo}.`,
        type: 'error',
      });
    } finally {
      setLoadingModel(null);
    }
  };

  const handleUnload = async () => {
    try {
      setLoadingModel('unload');
      await unloadModel();
      setStatusMessage({ text: 'Active model unloaded from memory.', type: 'success' });
      onRefreshModels();
    } catch (err: any) {
      setStatusMessage({ text: 'Failed to unload model.', type: 'error' });
    } finally {
      setLoadingModel(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border-dark">
        <div>
          <h2 className="text-2xl font-black text-text-main tracking-tight flex items-center gap-2">
            <Box className="w-6 h-6 text-accent-primary" />
            Pretrained Model Hub
          </h2>
          <p className="text-sm text-text-muted mt-1">
            Curated, verified open-source language models verified for CPU and memory efficiency.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleUnload}
            disabled={loadingModel !== null}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-bg-elevated hover:bg-bg-elevated/70 border border-border-dark text-text-muted hover:text-text-main text-xs font-medium transition-colors"
          >
            <Power className="w-3.5 h-3.5 text-status-warning" />
            Unload Active Model
          </button>
          <button
            onClick={onRefreshModels}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-bg-elevated hover:bg-bg-elevated/70 border border-border-dark text-text-muted hover:text-text-main text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Notifications */}
      {statusMessage && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between border ${
            statusMessage.type === 'success'
              ? 'bg-status-success/15 border-status-success/30 text-status-success'
              : 'bg-status-error/15 border-status-error/30 text-status-error'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="underline text-[10px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-bg-card p-3 rounded-xl border border-border-dark">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search models, architecture, repo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-bg-elevated border border-border-subtle rounded-lg text-xs text-text-main placeholder-text-muted/60 focus:outline-none focus:border-accent-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-text-muted">Task:</span>
          <select
            value={filterTask}
            onChange={(e) => setFilterTask(e.target.value)}
            className="bg-bg-elevated border border-border-subtle rounded-lg text-xs text-text-main py-1.5 px-3 focus:outline-none focus:border-accent-primary"
          >
            <option value="all">All Tasks</option>
            <option value="instruction-tuning">Instruction Tuning</option>
            <option value="chat">Chat / Conversational</option>
            <option value="code-generation">Code Generation</option>
            <option value="text-generation">Text Generation</option>
          </select>
        </div>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredModels.map((model) => (
          <div
            key={model.id}
            className={`bg-bg-card border rounded-xl p-6 flex flex-col justify-between transition-all ${
              model.is_loaded
                ? 'border-accent-primary shadow-lg shadow-accent-primary/10 ring-1 ring-accent-primary/30'
                : 'border-border-dark hover:border-border-subtle'
            }`}
          >
            <div className="space-y-4">
              {/* Header Badges */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-text-main">{model.name}</h3>
                    {model.recommended_for_cpu && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-status-success/15 text-status-success border border-status-success/30 flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" /> CPU Optimized
                      </span>
                    )}
                  </div>
                  <a
                    href={`https://huggingface.co/${model.hf_repo}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-text-muted hover:text-accent-secondary font-mono flex items-center gap-1 mt-0.5"
                  >
                    {model.hf_repo} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-bg-elevated border border-border-subtle rounded text-accent-secondary">
                    {model.parameters}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-text-muted leading-relaxed line-clamp-3">
                {model.description}
              </p>

              {/* Metadata Specs Grid */}
              <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                <div className="bg-bg-elevated p-2 rounded border border-border-subtle">
                  <span className="text-text-muted text-[10px] block">Architecture</span>
                  <span className="font-mono text-text-main font-semibold truncate block mt-0.5">
                    {model.architecture}
                  </span>
                </div>
                <div className="bg-bg-elevated p-2 rounded border border-border-subtle">
                  <span className="text-text-muted text-[10px] block">Min RAM</span>
                  <span className="font-mono text-text-main font-semibold block mt-0.5">
                    ~{model.min_ram_gb} GB
                  </span>
                </div>
                <div className="bg-bg-elevated p-2 rounded border border-border-subtle">
                  <span className="text-text-muted text-[10px] block">License</span>
                  <span className="font-mono text-text-main font-semibold block mt-0.5">
                    {model.license}
                  </span>
                </div>
              </div>

              {/* Supported Tasks */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {model.supported_tasks.map((task) => (
                  <span
                    key={task}
                    className="text-[10px] font-medium px-2 py-0.5 rounded bg-bg-elevated border border-border-subtle text-text-muted"
                  >
                    {task}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-5 mt-5 border-t border-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-2">
                {model.is_loaded ? (
                  <span className="text-xs font-bold text-accent-primary flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-accent-primary animate-ping" />
                    Loaded in RAM
                  </span>
                ) : model.is_downloaded ? (
                  <span className="text-xs text-status-success font-medium flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Cached on Disk
                  </span>
                ) : (
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" /> Ready to Download
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!model.is_downloaded ? (
                  <button
                    onClick={() => handleDownload(model.hf_repo)}
                    disabled={loadingModel === model.hf_repo}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-elevated hover:bg-bg-elevated/80 border border-border-subtle text-xs font-semibold text-text-main transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-accent-secondary" />
                    {loadingModel === model.hf_repo ? 'Downloading...' : 'Download'}
                  </button>
                ) : !model.is_loaded ? (
                  <button
                    onClick={() => handleLoad(model.hf_repo)}
                    disabled={loadingModel === model.hf_repo}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-primary hover:bg-accent-primary/90 text-xs font-semibold text-white transition-colors shadow-sm"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {loadingModel === model.hf_repo ? 'Loading...' : 'Load into RAM'}
                  </button>
                ) : (
                  <button
                    onClick={handleUnload}
                    disabled={loadingModel === 'unload'}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-elevated hover:bg-bg-elevated/70 border border-border-subtle text-xs font-semibold text-text-muted hover:text-text-main transition-colors"
                  >
                    Unload
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
