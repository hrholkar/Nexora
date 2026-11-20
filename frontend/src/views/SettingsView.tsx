import React, { useState } from 'react';
import {
  Settings,
  HardDrive,
  Cpu,
  ShieldCheck,
  Server,
  Database,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { HardwareInfo, HealthStatus } from '../types';

interface SettingsViewProps {
  hardware: HardwareInfo | null;
  health: HealthStatus | null;
  onRefreshHardware: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  hardware,
  health,
  onRefreshHardware,
}) => {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border-dark">
        <div>
          <h2 className="text-2xl font-black text-text-main tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-accent-secondary" />
            System & Deployment Settings
          </h2>
          <p className="text-sm text-text-muted mt-1">
            Host environment diagnostics, storage directories, and deployment configuration.
          </p>
        </div>

        <button
          onClick={onRefreshHardware}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-card hover:bg-bg-elevated border border-border-dark text-text-muted hover:text-text-main text-xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Re-check Hardware
        </button>
      </div>

      {/* Strict Zero-Cost Policy Compliance Audit */}
      <div className="bg-bg-card border border-status-success/30 rounded-xl p-6 space-y-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-status-success" />
          <h3 className="font-bold text-base text-text-main">Strict Zero-Cost Policy Audit</h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-status-success/20 text-status-success border border-status-success/30 font-bold ml-auto">
            100% Compliant (₹0 / $0)
          </span>
        </div>
        <p className="text-xs text-text-muted leading-relaxed">
          NEXORA operates completely without incurring financial cost. The public web app runs on Render Free tier; heavy LLM inference and PEFT LoRA fine-tuning execute locally on host CPU without commercial AI APIs or cloud GPU rental.
        </p>
      </div>

      {/* Execution Environments Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Environment A: Render Public Cloud */}
        <div className="bg-bg-card border border-border-dark rounded-xl p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-accent-primary" />
              <h4 className="font-bold text-sm text-text-main">Render Free Cloud Tier</h4>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-bg-elevated text-accent-primary font-bold">
              Public Portal
            </span>
          </div>
          <ul className="text-xs text-text-muted space-y-2 list-disc list-inside">
            <li>Frontend: Render Static Site (Vite + React SPA)</li>
            <li>Backend: Render Free Web Service (FastAPI)</li>
            <li>RAM Budget: 512 MB (Featherweight)</li>
            <li>Database: SQLite or Neon Free PostgreSQL</li>
            <li>Does not load heavy model weights in cloud memory</li>
          </ul>
        </div>

        {/* Environment B: Local ML Engine */}
        <div className="bg-bg-card border border-border-dark rounded-xl p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-accent-secondary" />
              <h4 className="font-bold text-sm text-text-main">Local CPU ML Engine</h4>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-bg-elevated text-status-success font-bold">
              Compute Node
            </span>
          </div>
          <ul className="text-xs text-text-muted space-y-2 list-disc list-inside">
            <li>Host RAM: 16 GB Physical Memory</li>
            <li>Compute: PyTorch FP32 on CPU (CUDA optional)</li>
            <li>Model Hub: SmolLM2-360M, DistilGPT2, Qwen2.5</li>
            <li>Fine-Tuning: PEFT LoRA rank-8, batch size 1</li>
            <li>Storage: Local SafeTensors & JSON Checkpoints</li>
          </ul>
        </div>
      </div>

      {/* Directory Paths */}
      <div className="bg-bg-card border border-border-dark rounded-xl p-6 space-y-4 text-xs font-mono">
        <h4 className="font-bold font-sans text-sm text-text-main border-b border-border-subtle pb-2">
          Configured Storage Paths
        </h4>
        <div className="space-y-2 text-text-muted">
          <div>
            <span className="text-text-main font-semibold">Model Cache:</span>{' '}
            <span className="text-accent-secondary">storage/models/</span>
          </div>
          <div>
            <span className="text-text-main font-semibold">Dataset Store:</span>{' '}
            <span className="text-accent-secondary">storage/datasets/</span>
          </div>
          <div>
            <span className="text-text-main font-semibold">LoRA Adapters:</span>{' '}
            <span className="text-accent-secondary">storage/adapters/</span>
          </div>
          <div>
            <span className="text-text-main font-semibold">Technical Reports:</span>{' '}
            <span className="text-accent-secondary">storage/reports/</span>
          </div>
        </div>
      </div>
    </div>
  );
};
