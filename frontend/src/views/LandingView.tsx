import React from 'react';
import {
  Sparkles,
  Cpu,
  Layers,
  Database,
  Flame,
  MessageSquare,
  BarChart2,
  FileText,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  GitBranch,
  Terminal
} from 'lucide-react';
import { NavItemKey } from '../components/Sidebar';

interface LandingViewProps {
  onNavigate: (view: NavItemKey) => void;
  mlEngineOnline: boolean;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate, mlEngineOnline }) => {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12 animate-in fade-in duration-200">
      {/* Hero Header */}
      <div className="relative rounded-2xl bg-gradient-to-br from-bg-card via-bg-elevated to-bg-card border border-border-dark p-8 md:p-12 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-primary/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent-secondary/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-primary/15 border border-accent-primary/30 text-accent-primary text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-accent-secondary" />
            Open-Source Academic LLM Research & Adaptation
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-text-main tracking-tight leading-tight">
            NEXORA <br />
            <span className="bg-gradient-to-r from-accent-primary via-purple-400 to-accent-secondary bg-clip-text text-transparent">
              Where Language Models Evolve.
            </span>
          </h1>

          <p className="text-base md:text-lg text-text-muted leading-relaxed">
            A genuine, zero-cost LLM engineering platform designed for model exploration, dataset validation,
            Low-Rank Adaptation (LoRA) fine-tuning on local CPU hardware, interactive playground inference,
            quantitative evaluation, and publication-ready academic report generation.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-primary hover:bg-accent-primary/90 text-white font-semibold shadow-lg shadow-accent-primary/25 transition-all text-sm"
            >
              Enter Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('models')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-bg-elevated hover:bg-bg-elevated/80 border border-border-dark text-text-main font-medium transition-all text-sm"
            >
              <Layers className="w-4 h-4 text-accent-secondary" />
              Explore Model Hub
            </button>
            <button
              onClick={() => onNavigate('training')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-bg-elevated hover:bg-bg-elevated/80 border border-border-dark text-text-main font-medium transition-all text-sm"
            >
              <Flame className="w-4 h-4 text-status-warning" />
              Fine-Tuning Studio
            </button>
          </div>
        </div>
      </div>

      {/* Architecture Highlights: Zero Cost & Separation of Concerns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-bg-card border border-border-dark p-6 rounded-xl space-y-3">
          <div className="w-10 h-10 rounded-lg bg-status-success/15 border border-status-success/30 flex items-center justify-center text-status-success">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-text-main">Strict Zero-Cost Guarantee</h3>
          <p className="text-sm text-text-muted leading-relaxed">
            Budget is ₹0 / $0. Built strictly with free open-source tools: Render Free Tier, GitHub, Hugging Face open weights, and local CPU computation.
          </p>
        </div>

        <div className="bg-bg-card border border-border-dark p-6 rounded-xl space-y-3">
          <div className="w-10 h-10 rounded-lg bg-accent-secondary/15 border border-accent-secondary/30 flex items-center justify-center text-accent-secondary">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-text-main">Local CPU-Only ML Engine</h3>
          <p className="text-sm text-text-muted leading-relaxed">
            No expensive GPUs required. Automatically tunes gradient accumulation, batch sizes (1), and sequence lengths (128-256) to execute FP32 LoRA training on 16GB RAM.
          </p>
        </div>

        <div className="bg-bg-card border border-border-dark p-6 rounded-xl space-y-3">
          <div className="w-10 h-10 rounded-lg bg-accent-primary/15 border border-accent-primary/30 flex items-center justify-center text-accent-primary">
            <GitBranch className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-text-main">Clean Dual Architecture</h3>
          <p className="text-sm text-text-muted leading-relaxed">
            A lightweight public web portal hosted on Render Free communicates seamlessly with your local ML engine for heavy compute, keeping cloud footprints featherweight.
          </p>
        </div>
      </div>

      {/* Complete LLM Lifecycle Workflow */}
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-text-main">Complete LLM Engineering Lifecycle</h2>
          <p className="text-sm text-text-muted">
            End-to-end reproducible research workflow from raw weights to evaluated adapter.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div 
            onClick={() => onNavigate('models')}
            className="group bg-bg-card hover:bg-bg-elevated border border-border-dark hover:border-accent-primary/50 p-5 rounded-xl transition-all cursor-pointer space-y-3"
          >
            <div className="w-8 h-8 rounded-lg bg-bg-elevated group-hover:bg-accent-primary/20 flex items-center justify-center text-accent-primary font-bold text-sm">
              1
            </div>
            <h4 className="font-bold text-text-main group-hover:text-accent-primary transition-colors">
              Model Discovery & Cache
            </h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Select curated compact models (SmolLM2-360M, Qwen2.5-0.5B, TinyLlama-1.1B, DistilGPT2) with hardware footprint analysis.
            </p>
          </div>

          <div 
            onClick={() => onNavigate('datasets')}
            className="group bg-bg-card hover:bg-bg-elevated border border-border-dark hover:border-accent-secondary/50 p-5 rounded-xl transition-all cursor-pointer space-y-3"
          >
            <div className="w-8 h-8 rounded-lg bg-bg-elevated group-hover:bg-accent-secondary/20 flex items-center justify-center text-accent-secondary font-bold text-sm">
              2
            </div>
            <h4 className="font-bold text-text-main group-hover:text-accent-secondary transition-colors">
              Dataset Studio
            </h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Upload JSON, JSONL, or CSV datasets. Automatic schema validation, duplicate detection, deduplication, and train/val splits.
            </p>
          </div>

          <div 
            onClick={() => onNavigate('training')}
            className="group bg-bg-card hover:bg-bg-elevated border border-border-dark hover:border-status-warning/50 p-5 rounded-xl transition-all cursor-pointer space-y-3"
          >
            <div className="w-8 h-8 rounded-lg bg-bg-elevated group-hover:bg-status-warning/20 flex items-center justify-center text-status-warning font-bold text-sm">
              3
            </div>
            <h4 className="font-bold text-text-main group-hover:text-status-warning transition-colors">
              LoRA Fine-Tuning
            </h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Execute real parameter-efficient fine-tuning with live step loss monitoring, CPU/RAM utilization telemetry, and adapter serialization.
            </p>
          </div>

          <div 
            onClick={() => onNavigate('playground')}
            className="group bg-bg-card hover:bg-bg-elevated border border-border-dark hover:border-accent-primary/50 p-5 rounded-xl transition-all cursor-pointer space-y-3"
          >
            <div className="w-8 h-8 rounded-lg bg-bg-elevated group-hover:bg-accent-primary/20 flex items-center justify-center text-accent-primary font-bold text-sm">
              4
            </div>
            <h4 className="font-bold text-text-main group-hover:text-accent-primary transition-colors">
              Playground & Evaluation
            </h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Compare base pretrained model vs fine-tuned LoRA adapter side-by-side. Calculate Perplexity, ROUGE, and generate PDF research reports.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Launch Terminal Banner */}
      <div className="bg-bg-card border border-border-dark rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-bg-elevated rounded-xl border border-border-subtle text-accent-secondary">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-text-main text-sm">Running Local ML Workers</h4>
            <p className="text-xs text-text-muted">
              Start local FastAPI with Python virtual environment: <code className="text-accent-primary font-mono text-[11px]">.\.venv\Scripts\uvicorn backend.app.main:app --port 8000</code>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${mlEngineOnline ? 'bg-status-success animate-ping' : 'bg-status-warning'}`} />
          <span className="text-xs font-mono font-medium text-text-main">
            {mlEngineOnline ? 'Engine Online' : 'Cloud Standby'}
          </span>
        </div>
      </div>
    </div>
  );
};
