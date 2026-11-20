import React, { useState } from 'react';
import {
  BarChart2,
  Play,
  CheckCircle2,
  Layers,
  Database,
  ArrowRight,
  ShieldAlert,
  Info,
  Activity
} from 'lucide-react';
import { ModelCard, DatasetMetadata, ExperimentSummary, EvaluationResponse } from '../types';
import { runEvaluation, getEvaluations } from '../api/client';

interface EvaluationViewProps {
  models: ModelCard[];
  datasets: DatasetMetadata[];
  experiments: ExperimentSummary[];
}

export const EvaluationView: React.FC<EvaluationViewProps> = ({
  models,
  datasets,
  experiments,
}) => {
  const [modelName, setModelName] = useState<string>(
    models[0]?.hf_repo || 'HuggingFaceTB/SmolLM2-360M-Instruct'
  );
  const [datasetId, setDatasetId] = useState<string>(datasets[0]?.id || '');
  const [adapterId, setAdapterId] = useState<string>('');
  const [sampleLimit, setSampleLimit] = useState<number>(10);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentEval, setCurrentEval] = useState<EvaluationResponse | null>(null);
  const [pastEvaluations, setPastEvaluations] = useState<EvaluationResponse[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const completedAdapters = experiments.filter((e) => e.status === 'COMPLETED' && e.adapter_path);

  React.useEffect(() => {
    loadEvaluations();
  }, []);

  const loadEvaluations = async () => {
    try {
      const data = await getEvaluations();
      setPastEvaluations(data);
    } catch (err) {
      console.error('Failed to load past evaluations', err);
    }
  };

  const handleRunEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!datasetId) {
      setErrorMsg('Please select an evaluation dataset.');
      return;
    }

    try {
      setIsRunning(true);
      setErrorMsg(null);
      const res = await runEvaluation({
        model_name: modelName,
        dataset_id: datasetId,
        adapter_id: adapterId || null,
        experiment_id: adapterId || null,
        metrics: ['perplexity', 'bleu', 'rouge', 'exact_match', 'token_f1'],
        sample_limit: sampleLimit,
      });
      setCurrentEval(res);
      loadEvaluations();
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.detail || 'Failed to execute evaluation. Verify local ML worker status.'
      );
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border-dark">
        <div>
          <h2 className="text-2xl font-black text-text-main tracking-tight flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-status-success" />
            Model Benchmark & Evaluation
          </h2>
          <p className="text-sm text-text-muted mt-1">
            Calculate empirical academic metrics: Perplexity, ROUGE-1/2/L, Token F1, BLEU, and Exact Match.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-status-error/15 border border-status-error/30 rounded-lg text-xs font-medium text-status-error">
          {errorMsg}
        </div>
      )}

      {/* Main Grid: Form Setup & Results Scorecards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Setup Card */}
        <div className="lg:col-span-4 bg-bg-card border border-border-dark rounded-xl p-6 space-y-5 text-xs">
          <div className="border-b border-border-subtle pb-3">
            <h3 className="font-bold text-base text-text-main">Configure Benchmark</h3>
            <p className="text-xs text-text-muted">Select candidate model and ground truth dataset.</p>
          </div>

          <form onSubmit={handleRunEvaluation} className="space-y-4">
            <div>
              <label className="text-text-muted font-medium block mb-1">Target Model</label>
              <select
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
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
              <label className="text-text-muted font-medium block mb-1">LoRA Adapter (Optional)</label>
              <select
                value={adapterId}
                onChange={(e) => setAdapterId(e.target.value)}
                className="w-full bg-bg-elevated border border-border-subtle rounded-lg py-2 px-3 text-text-main font-mono focus:outline-none focus:border-accent-primary"
              >
                <option value="">None (Evaluate Base Model)</option>
                {completedAdapters.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} (Loss: {a.train_loss?.toFixed(3) || 'N/A'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-text-muted font-medium block mb-1">Evaluation Dataset</label>
              <select
                value={datasetId}
                onChange={(e) => setDatasetId(e.target.value)}
                required
                className="w-full bg-bg-elevated border border-border-subtle rounded-lg py-2 px-3 text-text-main font-mono focus:outline-none focus:border-accent-primary"
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.sample_count} samples)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-text-muted font-medium block mb-1">Sample Limit for Evaluation</label>
              <input
                type="number"
                min="2"
                max="50"
                value={sampleLimit}
                onChange={(e) => setSampleLimit(parseInt(e.target.value) || 10)}
                className="w-full bg-bg-elevated border border-border-subtle rounded-lg py-1.5 px-3 text-text-main font-mono"
              />
              <span className="text-[10px] text-text-muted mt-1 block">
                Limits test samples to conserve CPU runtime.
              </span>
            </div>

            <button
              type="submit"
              disabled={isRunning}
              className="w-full py-3 bg-status-success hover:bg-status-success/90 text-bg-main font-bold rounded-xl text-xs shadow-md shadow-status-success/20 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              {isRunning ? 'Computing Benchmark Metrics...' : 'Run Benchmark Suite'}
            </button>
          </form>
        </div>

        {/* Right: Results Scorecards */}
        <div className="lg:col-span-8 space-y-6">
          {currentEval ? (
            <div className="bg-bg-card border border-border-dark rounded-xl p-6 space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-status-success">
                    Benchmark Result
                  </span>
                  <h3 className="font-bold text-lg text-text-main mt-0.5">
                    {currentEval.model_name}{' '}
                    {currentEval.adapter_id ? '(LoRA Adapted)' : '(Base Pretrained)'}
                  </h3>
                  <p className="text-xs text-text-muted">
                    Evaluated against: <span className="font-mono">{currentEval.dataset_name}</span> ({currentEval.samples_evaluated} test samples)
                  </p>
                </div>
              </div>

              {/* Metric Scorecards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div className="bg-bg-elevated p-4 rounded-xl border border-border-subtle space-y-1">
                  <span className="text-text-muted text-[10px] uppercase font-bold block">
                    Perplexity (PPL)
                  </span>
                  <span className="text-2xl font-bold text-accent-secondary block">
                    {currentEval.metrics.perplexity ?? 'N/A'}
                  </span>
                  <span className="text-[10px] text-text-muted block">
                    Lower indicates better generative certainty.
                  </span>
                </div>

                <div className="bg-bg-elevated p-4 rounded-xl border border-border-subtle space-y-1">
                  <span className="text-text-muted text-[10px] uppercase font-bold block">
                    ROUGE-1
                  </span>
                  <span className="text-2xl font-bold text-status-success block">
                    {currentEval.metrics.rouge1 ?? '0.000'}
                  </span>
                  <span className="text-[10px] text-text-muted block">Unigram token recall.</span>
                </div>

                <div className="bg-bg-elevated p-4 rounded-xl border border-border-subtle space-y-1">
                  <span className="text-text-muted text-[10px] uppercase font-bold block">
                    ROUGE-2
                  </span>
                  <span className="text-2xl font-bold text-status-success block">
                    {currentEval.metrics.rouge2 ?? '0.000'}
                  </span>
                  <span className="text-[10px] text-text-muted block">Bigram phrase recall.</span>
                </div>

                <div className="bg-bg-elevated p-4 rounded-xl border border-border-subtle space-y-1">
                  <span className="text-text-muted text-[10px] uppercase font-bold block">
                    ROUGE-L
                  </span>
                  <span className="text-2xl font-bold text-status-success block">
                    {currentEval.metrics.rougeL ?? '0.000'}
                  </span>
                  <span className="text-[10px] text-text-muted block">
                    Longest Common Subsequence fluency.
                  </span>
                </div>

                <div className="bg-bg-elevated p-4 rounded-xl border border-border-subtle space-y-1">
                  <span className="text-text-muted text-[10px] uppercase font-bold block">
                    Token F1
                  </span>
                  <span className="text-2xl font-bold text-accent-primary block">
                    {currentEval.metrics.token_f1 ?? '0.000'}
                  </span>
                  <span className="text-[10px] text-text-muted block">
                    Harmonic mean of precision & recall.
                  </span>
                </div>

                <div className="bg-bg-elevated p-4 rounded-xl border border-border-subtle space-y-1">
                  <span className="text-text-muted text-[10px] uppercase font-bold block">
                    Exact Match (EM)
                  </span>
                  <span className="text-2xl font-bold text-text-main block">
                    {((currentEval.metrics.exact_match ?? 0) * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-text-muted block">
                    Binary identical response match.
                  </span>
                </div>
              </div>

              {/* Metric Limitations Note */}
              <div className="bg-bg-elevated/40 p-4 rounded-xl border border-border-subtle text-xs text-text-muted flex items-start gap-2.5">
                <Info className="w-4 h-4 text-accent-secondary shrink-0 mt-0.5" />
                <p>
                  <b>Evaluation Methodology Note:</b> Automated n-gram overlap metrics (ROUGE/BLEU)
                  measure lexical surface alignment with reference outputs. For open-ended creative tasks,
                  supplement quantitative scores with qualitative side-by-side comparison in the Playground.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-bg-card border border-border-dark rounded-xl p-12 text-center text-xs text-text-muted space-y-3">
              <BarChart2 className="w-10 h-10 mx-auto text-text-muted/30" />
              <p className="text-text-main font-semibold">No Benchmark Run Selected</p>
              <p>Configure model and dataset on the left and click "Run Benchmark Suite" to compute metrics.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
