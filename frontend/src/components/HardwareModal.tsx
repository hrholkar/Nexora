import React from 'react';
import { X, RefreshCw, Cpu, HardDrive, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';
import { HardwareInfo } from '../types';

interface HardwareModalProps {
  hardware: HardwareInfo | null;
  onClose: () => void;
  onRefresh: () => void;
}

export const HardwareModal: React.FC<HardwareModalProps> = ({ hardware, onClose, onRefresh }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-bg-card border border-border-dark rounded-xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-dark flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-accent-primary" />
            <h3 className="font-bold text-text-main text-base">Host Hardware Architecture</h3>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-main p-1 rounded-lg hover:bg-bg-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {!hardware ? (
            <div className="text-center py-8 text-text-muted">Loading hardware information...</div>
          ) : (
            <>
              {/* Architecture Overview Card */}
              <div className="bg-bg-elevated p-4 rounded-lg border border-border-subtle flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">
                    Primary Compute Backend
                  </p>
                  <p className="text-lg font-bold text-accent-primary flex items-center gap-2 mt-0.5">
                    {hardware.device === 'cuda' ? 'NVIDIA CUDA GPU' : 'Host CPU Engine'}
                    <span className="text-xs px-2 py-0.5 rounded font-mono font-normal bg-accent-primary/20 text-accent-primary">
                      {hardware.precision.toUpperCase()}
                    </span>
                  </p>
                </div>
                {hardware.cuda_available ? (
                  <CheckCircle2 className="w-6 h-6 text-status-success" />
                ) : (
                  <div className="text-right">
                    <span className="text-xs text-status-warning bg-status-warning/10 border border-status-warning/20 px-2 py-0.5 rounded font-medium">
                      Zero-Cost CPU Mode
                    </span>
                  </div>
                )}
              </div>

              {/* Resource Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-bg-main p-3.5 rounded-lg border border-border-subtle">
                  <span className="text-text-muted text-xs flex items-center gap-1.5 mb-1">
                    <Cpu className="w-3.5 h-3.5 text-accent-secondary" />
                    Physical Cores / Threads
                  </span>
                  <p className="text-lg font-mono font-bold text-text-main">
                    {hardware.cpu_cores_physical} Cores / {hardware.cpu_cores_logical} Threads
                  </p>
                  <div className="mt-2 w-full bg-bg-elevated h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-accent-secondary h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(hardware.cpu_usage_percent, 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-text-muted mt-1 text-right">
                    {hardware.cpu_usage_percent.toFixed(1)}% Current Load
                  </p>
                </div>

                <div className="bg-bg-main p-3.5 rounded-lg border border-border-subtle">
                  <span className="text-text-muted text-xs flex items-center gap-1.5 mb-1">
                    <HardDrive className="w-3.5 h-3.5 text-accent-primary" />
                    System RAM Allocation
                  </span>
                  <p className="text-lg font-mono font-bold text-text-main">
                    {hardware.free_ram_gb} GB Free / {hardware.total_ram_gb} GB
                  </p>
                  <div className="mt-2 w-full bg-bg-elevated h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-accent-primary h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(hardware.ram_usage_percent, 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-text-muted mt-1 text-right">
                    {hardware.ram_usage_percent.toFixed(1)}% Utilized
                  </p>
                </div>
              </div>

              {/* Recommended Hyperparameters */}
              <div className="bg-bg-elevated/60 p-4 rounded-lg border border-border-subtle space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-status-warning" />
                  Auto-Tuned Hyperparameters for this Hardware
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
                  <div className="bg-bg-card p-2 rounded border border-border-subtle">
                    <p className="text-text-muted text-[10px]">Batch Size</p>
                    <p className="text-accent-secondary font-bold text-sm mt-0.5">
                      {hardware.recommended_batch_size}
                    </p>
                  </div>
                  <div className="bg-bg-card p-2 rounded border border-border-subtle">
                    <p className="text-text-muted text-[10px]">Grad Accum</p>
                    <p className="text-accent-secondary font-bold text-sm mt-0.5">
                      {hardware.recommended_grad_accum}
                    </p>
                  </div>
                  <div className="bg-bg-card p-2 rounded border border-border-subtle">
                    <p className="text-text-muted text-[10px]">Max Seq Len</p>
                    <p className="text-accent-secondary font-bold text-sm mt-0.5">
                      {hardware.recommended_seq_len}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-text-muted bg-bg-main p-3 rounded border border-border-subtle">
                <p>
                  <b>Zero-Cost Policy Compliant:</b> Operating strictly on local hardware and Render
                  free tier. No paid GPUs, cloud instances, or external paid APIs are provisioned.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border-dark bg-bg-card flex items-center justify-between">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-main px-3 py-1.5 rounded-lg border border-border-subtle hover:bg-bg-elevated transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Diagnostics
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-accent-primary hover:bg-accent-primary/90 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
