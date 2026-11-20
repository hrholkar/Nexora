import React, { useState, useEffect } from 'react';
import {
  Flame,
  Play,
  Square,
  CheckCircle2,
  AlertCircle,
  Activity,
  Cpu,
  Clock,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingDown,
  FileText
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { ModelCard, DatasetMetadata, TrainingStatus, HardwareInfo } from '../types';
import { startTraining, getTrainingStatus, cancelTraining } from '../api/client';
import { NavItemKey } from '../components/Sidebar';

interface FineTuningViewProps {
  models: ModelCard[];
  datasets: DatasetMetadata[];
  hardware: HardwareInfo | null;
  onNavigate: (view: NavItemKey) => void;
  onRefreshExperiments: () => void;
}

export const FineTuningView: React.FC<FineTuningViewProps> = ({
  models,
  datasets,
  hardware,
  onNavigate,
  onRefreshExperiments,
}) => {
  // Form Config
  const [modelName, setModelName] = useState<string>(
    models[0]?.hf_repo || 'HuggingFaceTB/SmolLM2-360M-Instruct'
  );
  const [datasetId, setDatasetId] = useState<string>(datasets[0]?.id || '');
  const [expName, setExpName] = useState<string>('SmolLM2-LoRA-Run-1');
  const [epochs, setEpochs] = useState<number>(1);
  const [learningRate, setLearningRate] = useState<number>(0.0003);
  const [batchSize, setBatchSize] = useState<number>(hardware?.recommended_batch_size || 1);
  const [gradAccum, setGradAccum] = useState<number>(hardware?.recommended_grad_accum || 4);
  const [maxSeqLength, setMaxSeqLength] = useState<number>(hardware?.recommended_seq_len || 256);
  const [loraR, setLoraR] = useState<number>(8);
  const [loraAlpha, setLoraAlpha] = useState<number>(16);
  const [loraDropout, setLoraDropout] = useState<number>(0.05);

  // Active Training State
  const [activeExpId, setActiveExpId] = useState<string | null>(null);
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus | null>(null);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Poll status while job is RUNNING or QUEUED
  useEffect(() => {
    let interval: any = null;
    if (activeExpId && trainingStatus?.status !== 'COMPLETED' && trainingStatus?.status !== 'FAILED' && trainingStatus?.status !== 'CANCELLED') {
      interval = setInterval(async () => {
        try {
          const status = await getTrainingStatus(activeExpId);
          setTrainingStatus(status);
          if (status.status === 'COMPLETED' || status.status === 'FAILED') {
            onRefreshExperiments();
          }
        } catch (err) {
          console.error('Error polling training status:', err);
        }
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeExpId, trainingStatus?.status]);

  const handleStartTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!datasetId) {
      setErrorMsg('Please select a dataset.');
      return;
    }

    try {
      setIsStarting(true);
      setErrorMsg(null);
      const res = await startTraining({
        model_name: modelName,
        dataset_id: datasetId,
        experiment_name: expName,
        epochs,
        learning_rate: learningRate,
        batch_size: batchSize,
        gradient_accumulation_steps: gradAccum,
        max_seq_length: maxSeqLength,
        lora_r: loraR,
        lora_alpha: loraAlpha,
        lora_dropout: loraDropout,
        warmup_steps: 2,
        weight_decay: 0.01,
        seed: 42,
      });

      setActiveExpId(res.experiment_id);
      setTrainingStatus({
        experiment_id: res.experiment_id,
        name: expName,
        status: 'RUNNING',
        base_model: modelName,
        current_epoch: 0,
        total_epochs: epochs,
        current_step: 0,
        total_steps: 0,
        elapsed_sec: 0,
        cpu_percent: 0,
        ram_percent: 0,
        loss_history: [],
      });
      onRefreshExperiments();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to start LoRA fine-tuning.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleCancelTraining = async () => {
    if (!activeExpId) return;
    try {
      await cancelTraining(activeExpId);
      setTrainingStatus((prev) => (prev ? { ...prev, status: 'CANCELLED' } : null));
      onRefreshExperiments();
    } catch (err: any) {
      setErrorMsg('Failed to cancel training.');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border-dark">
        <div>
          <h2 className="text-2xl font-black text-text-main tracking-tight flex items-center gap-2">
            <Flame className="w-6 h-6 text-status-warning" />
            LoRA Fine-Tuning Studio
          </h2>
          <p className="text-sm text-text-muted mt-1">
            Configure and execute actual Parameter-Efficient Fine-Tuning (PEFT) on CPU hardware.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-bg-card px-3 py-1.5 rounded-lg border border-border-dark">
          <span className="text-text-muted">Target Precision:</span>
          <span className="text-accent-secondary font-bold">FP32 (CPU Safe)</span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-status-error/15 border border-status-error/30 rounded-lg text-xs font-medium text-status-error flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="underline text-[10px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Config Form & Live Monitoring Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Hyperparameter Configuration Form */}
        <div className="lg:col-span-5 bg-bg-card border border-border-dark rounded-xl p-6 space-y-6">
          <div className="border-b border-border-subtle pb-3">
            <h3 className="font-bold text-base text-text-main">Hyperparameter Setup</h3>
            <p className="text-xs text-text-muted">Sensible CPU defaults are pre-configured.</p>
          </div>

          <form onSubmit={handleStartTraining} className="space-y-4 text-xs">
            {/* Experiment Name */}
            <div>
              <label className="text-text-muted font-medium block mb-1">Experiment Name</label>
              <input
                type="text"
                value={expName}
                onChange={(e) => setExpName(e.target.value)}
                required
                className="w-full bg-bg-elevated border border-border-subtle rounded-lg py-2 px-3 text-text-main font-mono focus:outline-none focus:border-accent-primary"
              />
            </div>

            {/* Base Model Selector */}
            <div>
              <label className="text-text-muted font-medium block mb-1">Base Pretrained Model</label>
              <select
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full bg-bg-elevated border border-border-subtle rounded-lg py-2 px-3 text-text-main font-mono focus:outline-none focus:border-accent-primary"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.hf_repo}>
                    {m.name} ({m.parameters}) {m.recommended_for_cpu ? '★ CPU Best' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Dataset Selector */}
            <div>
              <label className="text-text-muted font-medium block mb-1">Training Dataset</label>
              <select
                value={datasetId}
                onChange={(e) => setDatasetId(e.target.value)}
                required
                className="w-full bg-bg-elevated border border-border-subtle rounded-lg py-2 px-3 text-text-main font-mono focus:outline-none focus:border-accent-primary"
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.sample_count} samples, {d.file_format})
                  </option>
                ))}
              </select>
            </div>

            {/* Hyperparameter 2-Col Grid */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-text-muted block mb-1">Epochs</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={epochs}
                  onChange={(e) => setEpochs(parseInt(e.target.value) || 1)}
                  className="w-full bg-bg-elevated border border-border-subtle rounded-lg py-1.5 px-3 text-text-main font-mono"
                />
              </div>

              <div>
                <label className="text-text-muted block mb-1">Learning Rate</label>
                <input
                  type="number"
                  step="0.0001"
                  value={learningRate}
                  onChange={(e) => setLearningRate(parseFloat(e.target.value) || 0.0003)}
                  className="w-full bg-bg-elevated border border-border-subtle rounded-lg py-1.5 px-3 text-text-main font-mono"
                />
              </div>

              <div>
                <label className="text-text-muted block mb-1">Batch Size (CPU)</label>
                <input
                  type="number"
                  min="1"
                  max="4"
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value) || 1)}
                  className="w-full bg-bg-elevated border border-border-subtle rounded-lg py-1.5 px-3 text-text-main font-mono"
                />
              </div>

              <div>
                <label className="text-text-muted block mb-1">Grad Accum Steps</label>
                <input
                  type="number"
                  min="1"
                  max="16"
                  value={gradAccum}
                  onChange={(e) => setGradAccum(parseInt(e.target.value) || 4)}
                  className="w-full bg-bg-elevated border border-border-subtle rounded-lg py-1.5 px-3 text-text-main font-mono"
                />
              </div>

              <div>
                <label className="text-text-muted block mb-1">Max Sequence Length</label>
                <input
                  type="number"
                  min="32"
                  max="512"
                  step="32"
                  value={maxSeqLength}
                  onChange={(e) => setMaxSeqLength(parseInt(e.target.value) || 256)}
                  className="w-full bg-bg-elevated border border-border-subtle rounded-lg py-1.5 px-3 text-text-main font-mono"
                />
              </div>

              <div>
                <label className="text-text-muted block mb-1">LoRA Rank (r)</label>
                <input
                  type="number"
                  min="1"
                  max="32"
                  value={loraR}
                  onChange={(e) => setLoraR(parseInt(e.target.value) || 8)}
                  className="w-full bg-bg-elevated border border-border-subtle rounded-lg py-1.5 px-3 text-text-main font-mono"
                />
              </div>

              <div>
                <label className="text-text-muted block mb-1">LoRA Alpha</label>
                <input
                  type="number"
                  min="1"
                  max="64"
                  value={loraAlpha}
                  onChange={(e) => setLoraAlpha(parseInt(e.target.value) || 16)}
                  className="w-full bg-bg-elevated border border-border-subtle rounded-lg py-1.5 px-3 text-text-main font-mono"
                />
              </div>

              <div>
                <label className="text-text-muted block mb-1">LoRA Dropout</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="0.5"
                  value={loraDropout}
                  onChange={(e) => setLoraDropout(parseFloat(e.target.value) || 0.05)}
                  className="w-full bg-bg-elevated border border-border-subtle rounded-lg py-1.5 px-3 text-text-main font-mono"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isStarting || trainingStatus?.status === 'RUNNING'}
                className="w-full py-3 bg-accent-primary hover:bg-accent-primary/90 text-white font-bold rounded-xl text-xs shadow-lg shadow-accent-primary/25 transition-all flex items-center justify-center gap-2"
              >
                <Flame className="w-4 h-4" />
                {isStarting ? 'Initiating Pipeline...' : 'Start LoRA Fine-Tuning'}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Live Training Telemetry & Real-Time Loss Graph */}
        <div className="lg:col-span-7 bg-bg-card border border-border-dark rounded-xl p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Telemetry Header */}
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent-secondary" />
                <h3 className="font-bold text-base text-text-main">Live Telemetry & Loss Curves</h3>
              </div>

              {trainingStatus && (
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      trainingStatus.status === 'COMPLETED'
                        ? 'bg-status-success/15 text-status-success border border-status-success/30'
                        : trainingStatus.status === 'RUNNING'
                        ? 'bg-status-warning/15 text-status-warning border border-status-warning/30 animate-pulse'
                        : 'bg-bg-elevated text-text-muted border border-border-subtle'
                    }`}
                  >
                    {trainingStatus.status}
                  </span>

                  {trainingStatus.status === 'RUNNING' && (
                    <button
                      onClick={handleCancelTraining}
                      className="px-2 py-0.5 rounded bg-status-error/15 text-status-error border border-status-error/30 text-[10px] font-bold hover:bg-status-error/25 transition-colors flex items-center gap-1"
                    >
                      <Square className="w-2.5 h-2.5" /> Stop
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Metrics Chips */}
            {trainingStatus ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-bg-elevated p-3 rounded-lg border border-border-subtle">
                  <span className="text-text-muted text-[10px] block">Current Step</span>
                  <span className="font-mono text-base font-bold text-text-main block mt-0.5">
                    {trainingStatus.current_step} / {trainingStatus.total_steps || '-'}
                  </span>
                </div>
                <div className="bg-bg-elevated p-3 rounded-lg border border-border-subtle">
                  <span className="text-text-muted text-[10px] block">Training Loss</span>
                  <span className="font-mono text-base font-bold text-status-warning block mt-0.5">
                    {trainingStatus.train_loss !== null ? trainingStatus.train_loss.toFixed(4) : '-'}
                  </span>
                </div>
                <div className="bg-bg-elevated p-3 rounded-lg border border-border-subtle">
                  <span className="text-text-muted text-[10px] block">Elapsed Duration</span>
                  <span className="font-mono text-base font-bold text-accent-secondary block mt-0.5">
                    {trainingStatus.elapsed_sec.toFixed(1)}s
                  </span>
                </div>
                <div className="bg-bg-elevated p-3 rounded-lg border border-border-subtle">
                  <span className="text-text-muted text-[10px] block">Estimated ETA</span>
                  <span className="font-mono text-base font-bold text-text-muted block mt-0.5">
                    {trainingStatus.eta_sec !== null ? `${trainingStatus.eta_sec.toFixed(0)}s` : '-'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-bg-elevated/40 p-6 rounded-lg text-center text-text-muted text-xs border border-dashed border-border-subtle">
                Configure hyperparameters on the left and click "Start LoRA Fine-Tuning" to view live telemetry.
              </div>
            )}

            {/* Real-Time Recharts Loss Curve */}
            <div className="bg-bg-elevated/30 border border-border-subtle rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span className="font-semibold text-text-main flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-accent-primary" />
                  Cross-Entropy Step Loss History
                </span>
                <span className="text-[10px] font-mono">
                  {trainingStatus?.loss_history?.length || 0} recording points
                </span>
              </div>

              <div className="h-64 w-full">
                {trainingStatus?.loss_history && trainingStatus.loss_history.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trainingStatus.loss_history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#283044" />
                      <XAxis dataKey="step" stroke="#94A3B8" fontSize={10} />
                      <YAxis stroke="#94A3B8" fontSize={10} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#151A27',
                          borderColor: '#283044',
                          borderRadius: '8px',
                          color: '#F8FAFC',
                          fontSize: '11px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line
                        type="monotone"
                        dataKey="loss"
                        name="Train Loss"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                      {trainingStatus.loss_history[0]?.val_loss !== null && (
                        <Line
                          type="monotone"
                          dataKey="val_loss"
                          name="Val Loss"
                          stroke="#06B6D4"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-text-muted/60">
                    Loss curves will plot dynamically as training steps iterate.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Completion Callout */}
          {trainingStatus?.status === 'COMPLETED' && (
            <div className="bg-status-success/10 border border-status-success/30 rounded-xl p-4 flex items-center justify-between gap-4 mt-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-status-success" />
                <div>
                  <h4 className="font-bold text-text-main text-xs">LoRA Adapter Successfully Persisted!</h4>
                  <p className="text-[11px] font-mono text-text-muted truncate max-w-sm">
                    {trainingStatus.adapter_path}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('playground')}
                  className="px-3 py-1.5 rounded-lg bg-accent-primary hover:bg-accent-primary/90 text-white font-bold text-xs shadow-sm flex items-center gap-1"
                >
                  Test in Playground <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onNavigate('reports')}
                  className="px-3 py-1.5 rounded-lg bg-bg-elevated hover:bg-bg-elevated/70 border border-border-subtle text-text-main font-medium text-xs flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" /> Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
