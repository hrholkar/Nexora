import React, { useState } from 'react';
import {
  Columns,
  Play,
  Clock,
  Zap,
  Layers,
  ArrowRight,
  Sparkles,
  Bot,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { ModelCard, ExperimentSummary, InferenceResponse } from '../types';
import { runInference } from '../api/client';

interface ModelComparisonViewProps {
  models: ModelCard[];
  experiments: ExperimentSummary[];
  mlEngineOnline: boolean;
}

export const ModelComparisonView: React.FC<ModelComparisonViewProps> = ({
  models,
  experiments,
  mlEngineOnline,
}) => {
  const [prompt, setPrompt] = useState<string>(
    'Explain the concept of Low-Rank Adaptation (LoRA) and how it enables parameter-efficient fine-tuning.'
  );
  const [baseModelName, setBaseModelName] = useState<string>(
    models[0]?.hf_repo || 'HuggingFaceTB/SmolLM2-360M-Instruct'
  );
  const [adapterId, setAdapterId] = useState<string>(
    experiments.find((e) => e.status === 'COMPLETED' && e.adapter_path)?.id || ''
  );

  const [baseResult, setBaseResult] = useState<InferenceResponse | null>(null);
  const [adapterResult, setAdapterResult] = useState<InferenceResponse | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const completedAdapters = experiments.filter((e) => e.status === 'COMPLETED' && e.adapter_path);

  const handleRunComparison = async () => {
    if (!prompt.trim() || isComparing) return;

    try {
      setIsComparing(true);
      setErrorMsg(null);
      setBaseResult(null);
      setAdapterResult(null);

      // Run Base Model
      const resBase = await runInference({
        model_name: baseModelName,
        adapter_id: null,
        prompt: prompt.trim(),
        temperature: 0.0, // greedy for fair comparison
        top_p: 1.0,
        top_k: 50,
        max_new_tokens: 128,
        repetition_penalty: 1.1,
      });
      setBaseResult(resBase);

      // Run LoRA Adapter Model
      if (adapterId) {
        const resAdapter = await runInference({
          model_name: baseModelName,
          adapter_id: adapterId,
          prompt: prompt.trim(),
          temperature: 0.0,
          top_p: 1.0,
          top_k: 50,
          max_new_tokens: 128,
          repetition_penalty: 1.1,
        });
        setAdapterResult(resAdapter);
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.detail ||
          'Failed to execute comparison. Ensure backend and local ML engine are online.'
      );
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border-dark">
        <div>
          <h2 className="text-2xl font-black text-text-main tracking-tight flex items-center gap-2">
            <Columns className="w-6 h-6 text-accent-secondary" />
            Side-by-Side Model Comparison
          </h2>
          <p className="text-sm text-text-muted mt-1">
            Compare generative output, latency, and qualitative divergence between base pretrained models and trained LoRA adapters.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-status-error/15 border border-status-error/30 rounded-lg text-xs font-medium text-status-error">
          {errorMsg}
        </div>
      )}

      {/* Comparison Input Controls Card */}
      <div className="bg-bg-card border border-border-dark rounded-xl p-6 space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-text-muted font-medium block mb-1">Base Pretrained Model</label>
            <select
              value={baseModelName}
              onChange={(e) => setBaseModelName(e.target.value)}
              className="w-full bg-bg-elevated border border-border-subtle rounded-lg py-2 px-3 text-text-main font-mono focus:outline-none focus:border-accent-primary"
            >
              {models.map((m) => (
                <option key={m.id} value={m.hf_repo}>
                  {m.name} ({m.parameters})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-text-muted font-medium block mb-1">Fine-Tuned LoRA Adapter</label>
            <select
              value={adapterId}
              onChange={(e) => setAdapterId(e.target.value)}
              className="w-full bg-bg-elevated border border-border-subtle rounded-lg py-2 px-3 text-text-main font-mono focus:outline-none focus:border-accent-primary"
            >
              <option value="">Select an adapted model...</option>
              {completedAdapters.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (Base: {a.base_model}, Loss: {a.train_loss?.toFixed(3) || 'N/A'})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-text-muted font-medium block mb-1">Test Instruction / Prompt</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 bg-bg-elevated border border-border-subtle rounded-lg py-2 px-3 text-text-main font-mono text-xs focus:outline-none focus:border-accent-primary"
            />
            <button
              onClick={handleRunComparison}
              disabled={isComparing || !prompt.trim()}
              className="px-6 py-2 bg-accent-secondary hover:bg-accent-secondary/90 text-bg-main font-bold rounded-lg text-xs shadow-md flex items-center gap-2 shrink-0 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              {isComparing ? 'Evaluating Both...' : 'Run Comparison'}
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-Side Dual View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Base Pretrained Model */}
        <div className="bg-bg-card border border-border-dark rounded-xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">
                  Candidate A
                </span>
                <h4 className="font-bold text-sm text-text-main mt-0.5">Base Pretrained Model</h4>
              </div>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-bg-elevated text-text-muted">
                Zero Adapter
              </span>
            </div>

            <div className="bg-bg-elevated/50 p-4 rounded-lg min-h-[220px] text-xs font-mono text-text-main whitespace-pre-wrap leading-relaxed border border-border-subtle">
              {baseResult ? (
                baseResult.generated_text || '(Model returned empty response)'
              ) : isComparing ? (
                <div className="text-text-muted animate-pulse">Computing tokens on CPU...</div>
              ) : (
                <div className="text-text-muted/50">Run comparison to view generated tokens.</div>
              )}
            </div>
          </div>

          {baseResult && (
            <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-[11px] font-mono text-text-muted">
              <span>Latency: {baseResult.latency_ms} ms</span>
              <span>Tokens: {baseResult.completion_tokens}</span>
              <span>
                Speed: {(baseResult.completion_tokens / (baseResult.latency_ms / 1000)).toFixed(1)} t/s
              </span>
            </div>
          )}
        </div>

        {/* Right: Fine-Tuned Model (LoRA Adapter) */}
        <div className="bg-bg-card border border-accent-secondary/40 rounded-xl p-6 space-y-4 flex flex-col justify-between shadow-lg shadow-accent-secondary/5">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-accent-secondary tracking-wider block">
                  Candidate B
                </span>
                <h4 className="font-bold text-sm text-text-main mt-0.5">Fine-Tuned Model (LoRA)</h4>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-accent-secondary/20 text-accent-secondary border border-accent-secondary/30">
                LoRA Adapted
              </span>
            </div>

            <div className="bg-bg-elevated/50 p-4 rounded-lg min-h-[220px] text-xs font-mono text-text-main whitespace-pre-wrap leading-relaxed border border-border-subtle">
              {adapterResult ? (
                adapterResult.generated_text || '(Model returned empty response)'
              ) : isComparing ? (
                <div className="text-accent-secondary animate-pulse">Applying LoRA weights and computing tokens...</div>
              ) : (
                <div className="text-text-muted/50">Run comparison to view adapted tokens.</div>
              )}
            </div>
          </div>

          {adapterResult && (
            <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-[11px] font-mono text-text-muted">
              <span>Latency: {adapterResult.latency_ms} ms</span>
              <span>Tokens: {adapterResult.completion_tokens}</span>
              <span>
                Speed: {(adapterResult.completion_tokens / (adapterResult.latency_ms / 1000)).toFixed(1)} t/s
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
