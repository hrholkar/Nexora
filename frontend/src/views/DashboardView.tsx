import React from 'react';
import {
  Layers,
  Database,
  Flame,
  ListTree,
  Cpu,
  Activity,
  Play,
  ArrowRight,
  TrendingDown,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { ModelCard, DatasetMetadata, ExperimentSummary, HardwareInfo, HealthStatus } from '../types';
import { NavItemKey } from '../components/Sidebar';

interface DashboardViewProps {
  onNavigate: (view: NavItemKey) => void;
  models: ModelCard[];
  datasets: DatasetMetadata[];
  experiments: ExperimentSummary[];
  hardware: HardwareInfo | null;
  health: HealthStatus | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  models,
  datasets,
  experiments,
  hardware,
  health,
}) => {
  const downloadedModelsCount = models.filter((m) => m.is_downloaded).length;
  const runningJobsCount = experiments.filter((e) => e.status === 'RUNNING' || e.status === 'QUEUED').length;
  const completedJobsCount = experiments.filter((e) => e.status === 'COMPLETED').length;

  // Aggregate recent loss data from latest completed or running experiment
  const latestExp = experiments[0];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Top Greeting & Active State */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border-dark">
        <div>
          <h2 className="text-2xl font-black text-text-main tracking-tight flex items-center gap-2.5">
            Platform Dashboard
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent-primary/20 text-accent-primary border border-accent-primary/30">
              v1.0.0
            </span>
          </h2>
          <p className="text-sm text-text-muted mt-1">
            Real-time telemetry, model states, datasets, and LoRA experimentation jobs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('training')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-primary hover:bg-accent-primary/90 text-white font-medium text-xs shadow-md shadow-accent-primary/20 transition-all"
          >
            <Flame className="w-3.5 h-3.5" />
            New Fine-Tuning Job
          </button>
          <button
            onClick={() => onNavigate('playground')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-elevated hover:bg-bg-elevated/80 border border-border-dark text-text-main font-medium text-xs transition-all"
          >
            <Play className="w-3.5 h-3.5 text-accent-secondary" />
            Open Playground
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Experiments */}
        <div 
          onClick={() => onNavigate('experiments')}
          className="bg-bg-card hover:bg-bg-elevated/80 border border-border-dark p-5 rounded-xl cursor-pointer transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Total Experiments
            </span>
            <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary">
              <ListTree className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-mono font-bold text-text-main">{experiments.length}</p>
            <span className="text-xs text-status-success font-medium flex items-center gap-0.5">
              <CheckCircle className="w-3 h-3" /> {completedJobsCount} finished
            </span>
          </div>
          <p className="text-[11px] text-text-muted">Stored across local / PostgreSQL DB</p>
        </div>

        {/* Available Models */}
        <div 
          onClick={() => onNavigate('models')}
          className="bg-bg-card hover:bg-bg-elevated/80 border border-border-dark p-5 rounded-xl cursor-pointer transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Curated Models
            </span>
            <div className="p-2 rounded-lg bg-accent-secondary/10 text-accent-secondary">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-mono font-bold text-text-main">{models.length}</p>
            <span className="text-xs text-accent-secondary font-medium">
              {downloadedModelsCount} cached locally
            </span>
          </div>
          <p className="text-[11px] text-text-muted">SmolLM2-360M, Qwen2.5, TinyLlama</p>
        </div>

        {/* Uploaded Datasets */}
        <div 
          onClick={() => onNavigate('datasets')}
          className="bg-bg-card hover:bg-bg-elevated/80 border border-border-dark p-5 rounded-xl cursor-pointer transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Datasets In Studio
            </span>
            <div className="p-2 rounded-lg bg-status-success/10 text-status-success">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-mono font-bold text-text-main">{datasets.length}</p>
            <span className="text-xs text-text-muted">
              {datasets.reduce((acc, d) => acc + d.sample_count, 0)} total rows
            </span>
          </div>
          <p className="text-[11px] text-text-muted">Instruction & Conversational schemas</p>
        </div>

        {/* Active Training Status */}
        <div 
          onClick={() => onNavigate('training')}
          className="bg-bg-card hover:bg-bg-elevated/80 border border-border-dark p-5 rounded-xl cursor-pointer transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Training Pipeline
            </span>
            <div className="p-2 rounded-lg bg-status-warning/10 text-status-warning">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-mono font-bold text-text-main">{runningJobsCount}</p>
            <span className={`text-xs font-medium ${runningJobsCount > 0 ? 'text-status-warning animate-pulse' : 'text-text-muted'}`}>
              {runningJobsCount > 0 ? 'Job in progress' : 'Idle / Ready'}
            </span>
          </div>
          <p className="text-[11px] text-text-muted">LoRA rank-8 CPU training engine</p>
        </div>
      </div>

      {/* Middle Grid: Hardware Diagnostics & Quick Starter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hardware Status Card */}
        <div className="bg-bg-card border border-border-dark p-6 rounded-xl space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-accent-secondary" />
              <h3 className="font-bold text-text-main text-sm">Host Hardware Telemetry</h3>
            </div>
            <span className="text-[11px] font-mono text-text-muted bg-bg-elevated px-2 py-0.5 rounded">
              {hardware?.device.toUpperCase() || 'CPU'}
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between text-text-muted mb-1">
                <span>CPU Core Load</span>
                <span className="font-mono text-text-main font-semibold">
                  {hardware?.cpu_usage_percent.toFixed(1) || 0}%
                </span>
              </div>
              <div className="w-full bg-bg-elevated h-2 rounded-full overflow-hidden">
                <div
                  className="bg-accent-secondary h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(hardware?.cpu_usage_percent || 0, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-text-muted mt-1">
                {hardware?.cpu_cores_physical || 4} Physical / {hardware?.cpu_cores_logical || 8} Logical Cores
              </p>
            </div>

            <div>
              <div className="flex justify-between text-text-muted mb-1">
                <span>RAM Allocation</span>
                <span className="font-mono text-text-main font-semibold">
                  {hardware?.free_ram_gb || 0} GB Free / {hardware?.total_ram_gb || 16} GB
                </span>
              </div>
              <div className="w-full bg-bg-elevated h-2 rounded-full overflow-hidden">
                <div
                  className="bg-accent-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(hardware?.ram_usage_percent || 0, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-text-muted mt-1">
                FP32 execution with memory safeguards active
              </p>
            </div>

            <div className="bg-bg-elevated/70 p-3 rounded-lg border border-border-subtle space-y-1">
              <p className="text-[11px] font-semibold text-text-main">Hardware Presets:</p>
              <p className="text-[10px] text-text-muted leading-relaxed">
                Batch Size: <span className="text-accent-secondary font-mono">{hardware?.recommended_batch_size || 1}</span> | 
                Grad Accum: <span className="text-accent-secondary font-mono">{hardware?.recommended_grad_accum || 4}</span> | 
                Seq Len: <span className="text-accent-secondary font-mono">{hardware?.recommended_seq_len || 256}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Quick Launch & Workflow Guide */}
        <div className="bg-bg-card border border-border-dark p-6 rounded-xl space-y-4 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent-primary" />
                <h3 className="font-bold text-text-main text-sm">Recommended Next Actions</h3>
              </div>
              <span className="text-xs text-text-muted">Zero-Cost LLM Workflow</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div 
                onClick={() => onNavigate('models')}
                className="p-3.5 bg-bg-elevated hover:bg-bg-elevated/70 border border-border-subtle rounded-lg cursor-pointer transition-all space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-main">1. Download SmolLM2-360M</span>
                  <ArrowRight className="w-3.5 h-3.5 text-accent-primary" />
                </div>
                <p className="text-[11px] text-text-muted">
                  Compact 360M instruction model optimized for 16GB RAM CPU training.
                </p>
              </div>

              <div 
                onClick={() => onNavigate('datasets')}
                className="p-3.5 bg-bg-elevated hover:bg-bg-elevated/70 border border-border-subtle rounded-lg cursor-pointer transition-all space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-main">2. Inspect Seed Datasets</span>
                  <ArrowRight className="w-3.5 h-3.5 text-accent-secondary" />
                </div>
                <p className="text-[11px] text-text-muted">
                  Examine Academic Reasoning & Coding datasets ready for LoRA adaptation.
                </p>
              </div>

              <div 
                onClick={() => onNavigate('training')}
                className="p-3.5 bg-bg-elevated hover:bg-bg-elevated/70 border border-border-subtle rounded-lg cursor-pointer transition-all space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-main">3. Launch LoRA Fine-Tuning</span>
                  <ArrowRight className="w-3.5 h-3.5 text-status-warning" />
                </div>
                <p className="text-[11px] text-text-muted">
                  Train rank-8 LoRA adapter on CPU with real-time loss tracking.
                </p>
              </div>

              <div 
                onClick={() => onNavigate('playground')}
                className="p-3.5 bg-bg-elevated hover:bg-bg-elevated/70 border border-border-subtle rounded-lg cursor-pointer transition-all space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-main">4. Compare in Playground</span>
                  <ArrowRight className="w-3.5 h-3.5 text-status-success" />
                </div>
                <p className="text-[11px] text-text-muted">
                  Test prompt generation and compare base model vs fine-tuned adapter.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted">
            <span>Render Free Web Service + Local ML Engine Architecture</span>
            <span className="text-accent-secondary font-mono font-medium">Status: Active</span>
          </div>
        </div>
      </div>

      {/* Recent Experiments Table */}
      <div className="bg-bg-card border border-border-dark rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-text-main text-sm">Recent LoRA Experiments</h3>
            <p className="text-xs text-text-muted">Track parameter updates, loss trajectories, and adapter paths.</p>
          </div>
          <button
            onClick={() => onNavigate('experiments')}
            className="text-xs text-accent-primary hover:text-accent-primary/80 font-medium flex items-center gap-1"
          >
            View All ({experiments.length}) <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {experiments.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border-subtle rounded-lg text-text-muted text-xs space-y-2">
            <ListTree className="w-8 h-8 mx-auto text-text-muted/40" />
            <p>No experiments recorded yet.</p>
            <button
              onClick={() => onNavigate('training')}
              className="px-3 py-1.5 rounded-lg bg-accent-primary/20 text-accent-primary border border-accent-primary/30 text-xs font-medium hover:bg-accent-primary/30 transition-colors"
            >
              Start First Training Run
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg-elevated text-text-muted uppercase font-semibold text-[10px] tracking-wider border-b border-border-subtle">
                <tr>
                  <th className="py-2.5 px-3">Experiment Name</th>
                  <th className="py-2.5 px-3">Base Model</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Final Train Loss</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {experiments.slice(0, 5).map((exp) => (
                  <tr key={exp.id} className="hover:bg-bg-elevated/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-text-main max-w-[200px] truncate">
                      {exp.name}
                    </td>
                    <td className="py-3 px-3 font-mono text-text-muted max-w-[180px] truncate">
                      {exp.base_model}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          exp.status === 'COMPLETED'
                            ? 'bg-status-success/15 text-status-success border border-status-success/30'
                            : exp.status === 'RUNNING'
                            ? 'bg-status-warning/15 text-status-warning border border-status-warning/30 animate-pulse'
                            : 'bg-bg-elevated text-text-muted border border-border-subtle'
                        }`}
                      >
                        {exp.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-accent-secondary font-bold">
                      {exp.train_loss !== null ? exp.train_loss.toFixed(4) : '-'}
                    </td>
                    <td className="py-3 px-3 text-text-muted font-mono">
                      {exp.training_duration_sec > 0 ? `${exp.training_duration_sec.toFixed(1)}s` : '-'}
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => onNavigate('experiments')}
                        className="text-accent-primary hover:underline font-medium"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
