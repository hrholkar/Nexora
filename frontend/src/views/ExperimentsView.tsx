import React, { useState } from 'react';
import {
  ListTree,
  Trash2,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Columns,
  Layers,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { ExperimentSummary, ExperimentDetail } from '../types';
import { getExperiments, getExperimentDetail, deleteExperiment } from '../api/client';
import { NavItemKey } from '../components/Sidebar';

interface ExperimentsViewProps {
  experiments: ExperimentSummary[];
  onRefreshExperiments: () => void;
  onNavigate: (view: NavItemKey) => void;
}

export const ExperimentsView: React.FC<ExperimentsViewProps> = ({
  experiments,
  onRefreshExperiments,
  onNavigate,
}) => {
  const [selectedExpId, setSelectedExpId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ExperimentDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const loadDetail = async (id: string) => {
    try {
      setSelectedExpId(id);
      setLoadingDetail(true);
      const data = await getExperimentDetail(id);
      setDetail(data);
    } catch (err) {
      console.error('Failed to load experiment detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this experiment and its saved LoRA adapter?')) {
      return;
    }
    try {
      setIsDeleting(true);
      await deleteExperiment(id);
      if (selectedExpId === id) {
        setSelectedExpId(null);
        setDetail(null);
      }
      onRefreshExperiments();
    } catch (err) {
      alert('Failed to delete experiment.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border-dark">
        <div>
          <h2 className="text-2xl font-black text-text-main tracking-tight flex items-center gap-2">
            <ListTree className="w-6 h-6 text-accent-primary" />
            Experiment Management
          </h2>
          <p className="text-sm text-text-muted mt-1">
            Persisted metadata, training configurations, loss histories, and trained LoRA weights.
          </p>
        </div>

        <button
          onClick={() => onNavigate('training')}
          className="px-4 py-2 bg-accent-primary hover:bg-accent-primary/90 text-white font-semibold text-xs rounded-lg shadow-md transition-colors"
        >
          New Experiment
        </button>
      </div>

      {/* Main Grid: Experiments Table & Details Modal/Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Table */}
        <div className="lg:col-span-7 bg-bg-card border border-border-dark rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span className="font-bold uppercase tracking-wider text-text-main">
              Experiment Run History ({experiments.length})
            </span>
            <button onClick={onRefreshExperiments} className="hover:text-text-main">
              Refresh List
            </button>
          </div>

          {experiments.length === 0 ? (
            <div className="text-center py-12 text-text-muted text-xs border border-dashed border-border-subtle rounded-lg space-y-2">
              <p>No experiments recorded yet.</p>
              <button
                onClick={() => onNavigate('training')}
                className="text-accent-primary hover:underline font-semibold"
              >
                Launch your first fine-tuning run
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg-elevated text-text-muted uppercase text-[10px] font-semibold border-b border-border-subtle">
                  <tr>
                    <th className="py-2.5 px-3">Experiment</th>
                    <th className="py-2.5 px-3">Base Model</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Train Loss</th>
                    <th className="py-2.5 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {experiments.map((exp) => {
                    const isSelected = selectedExpId === exp.id;
                    return (
                      <tr
                        key={exp.id}
                        onClick={() => loadDetail(exp.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-bg-elevated/70' : 'hover:bg-bg-elevated/30'
                        }`}
                      >
                        <td className="py-3 px-3 font-semibold text-text-main max-w-[160px] truncate">
                          {exp.name}
                        </td>
                        <td className="py-3 px-3 font-mono text-text-muted max-w-[140px] truncate">
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
                        <td className="py-3 px-3 flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(exp.id);
                            }}
                            className="text-text-muted hover:text-status-error p-1 rounded"
                            title="Delete experiment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Selected Experiment Detail Panel */}
        <div className="lg:col-span-5 bg-bg-card border border-border-dark rounded-xl p-6 space-y-5 flex flex-col justify-between">
          {detail ? (
            <div className="space-y-5 text-xs animate-in fade-in duration-150">
              <div className="flex items-start justify-between border-b border-border-subtle pb-3">
                <div>
                  <h3 className="font-bold text-base text-text-main">{detail.name}</h3>
                  <p className="font-mono text-text-muted text-[10px] mt-0.5">{detail.id}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    detail.status === 'COMPLETED'
                      ? 'bg-status-success/15 text-status-success'
                      : 'bg-status-warning/15 text-status-warning'
                  }`}
                >
                  {detail.status}
                </span>
              </div>

              {/* Specs Summary Grid */}
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="bg-bg-elevated p-2.5 rounded border border-border-subtle">
                  <span className="text-text-muted text-[10px] block font-sans">Base Model</span>
                  <span className="font-bold text-text-main truncate block mt-0.5">
                    {detail.base_model}
                  </span>
                </div>
                <div className="bg-bg-elevated p-2.5 rounded border border-border-subtle">
                  <span className="text-text-muted text-[10px] block font-sans">Dataset</span>
                  <span className="font-bold text-text-main truncate block mt-0.5">
                    {detail.dataset_name || 'N/A'}
                  </span>
                </div>
                <div className="bg-bg-elevated p-2.5 rounded border border-border-subtle">
                  <span className="text-text-muted text-[10px] block font-sans">Final Train Loss</span>
                  <span className="font-bold text-status-warning block mt-0.5">
                    {detail.train_loss !== null ? detail.train_loss.toFixed(4) : '-'}
                  </span>
                </div>
                <div className="bg-bg-elevated p-2.5 rounded border border-border-subtle">
                  <span className="text-text-muted text-[10px] block font-sans">Duration</span>
                  <span className="font-bold text-accent-secondary block mt-0.5">
                    {detail.training_duration_sec.toFixed(1)}s
                  </span>
                </div>
              </div>

              {/* Adapter Persistence Path */}
              {detail.adapter_path && (
                <div className="bg-bg-elevated p-3 rounded-lg border border-border-subtle space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted block">
                    Saved PEFT Adapter Path
                  </span>
                  <span className="font-mono text-[11px] text-accent-secondary truncate block">
                    {detail.adapter_path}
                  </span>
                </div>
              )}

              {/* Hyperparameter JSON Dump */}
              <div className="space-y-1.5">
                <span className="text-text-muted font-medium text-[11px] block">
                  Configuration Hyperparameters:
                </span>
                <pre className="bg-bg-elevated p-3 rounded-lg border border-border-subtle font-mono text-[10px] text-text-muted max-h-36 overflow-auto">
                  {JSON.stringify(detail.config, null, 2)}
                </pre>
              </div>

              <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
                <button
                  onClick={() => onNavigate('reports')}
                  className="px-3.5 py-1.5 rounded-lg bg-bg-elevated hover:bg-bg-elevated/80 border border-border-subtle text-text-main font-semibold text-xs flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-accent-primary" /> Generate Report
                </button>
                <button
                  onClick={() => onNavigate('playground')}
                  className="px-3.5 py-1.5 rounded-lg bg-accent-primary hover:bg-accent-primary/90 text-white font-semibold text-xs flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" /> Test In Playground
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-text-muted text-xs">
              Select an experiment from the left table to inspect details and hyperparameters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
