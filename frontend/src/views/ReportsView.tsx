import React, { useState } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { ExperimentSummary, ReportResponse } from '../types';
import { generateReport } from '../api/client';

interface ReportsViewProps {
  experiments: ExperimentSummary[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ experiments }) => {
  const [selectedExpId, setSelectedExpId] = useState<string>(
    experiments[0]?.id || ''
  );
  const [reportFormat, setReportFormat] = useState<'pdf' | 'json'>('pdf');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedReport, setGeneratedReport] = useState<ReportResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedExp = experiments.find((e) => e.id === selectedExpId) || experiments[0];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpId) {
      setErrorMsg('Please select an experiment.');
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMsg(null);
      setGeneratedReport(null);
      const res = await generateReport(selectedExpId, reportFormat);
      setGeneratedReport(res);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.detail || 'Failed to generate technical report.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border-dark">
        <div>
          <h2 className="text-2xl font-black text-text-main tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-accent-primary" />
            Technical & Academic Reports
          </h2>
          <p className="text-sm text-text-muted mt-1">
            Generate formal, publication-grade PDF and JSON reports summarizing architecture, dataset, LoRA parameters, loss trajectory, and evaluation metrics.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-status-error/15 border border-status-error/30 rounded-lg text-xs font-medium text-status-error">
          {errorMsg}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Generator Form */}
        <div className="lg:col-span-5 bg-bg-card border border-border-dark rounded-xl p-6 space-y-5 text-xs">
          <div className="border-b border-border-subtle pb-3">
            <h3 className="font-bold text-base text-text-main">Generate Experiment Artifact</h3>
            <p className="text-xs text-text-muted">Export formal document with empirical results.</p>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="text-text-muted font-medium block mb-1">Target Experiment</label>
              <select
                value={selectedExpId}
                onChange={(e) => setSelectedExpId(e.target.value)}
                required
                className="w-full bg-bg-elevated border border-border-subtle rounded-lg py-2 px-3 text-text-main font-mono focus:outline-none focus:border-accent-primary"
              >
                {experiments.map((exp) => (
                  <option key={exp.id} value={exp.id}>
                    {exp.name} ({exp.base_model}, {exp.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-text-muted font-medium block mb-1">Export Format</label>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setReportFormat('pdf')}
                  className={`p-3 rounded-lg border font-semibold flex items-center justify-center gap-2 transition-all ${
                    reportFormat === 'pdf'
                      ? 'bg-accent-primary/20 border-accent-primary text-accent-primary'
                      : 'bg-bg-elevated border-border-subtle text-text-muted'
                  }`}
                >
                  <FileText className="w-4 h-4" /> Academic PDF
                </button>
                <button
                  type="button"
                  onClick={() => setReportFormat('json')}
                  className={`p-3 rounded-lg border font-semibold flex items-center justify-center gap-2 transition-all ${
                    reportFormat === 'json'
                      ? 'bg-accent-secondary/20 border-accent-secondary text-accent-secondary'
                      : 'bg-bg-elevated border-border-subtle text-text-muted'
                  }`}
                >
                  <FileCode className="w-4 h-4" /> Raw JSON Schema
                </button>
              </div>
            </div>

            {selectedExp && (
              <div className="bg-bg-elevated p-3.5 rounded-lg border border-border-subtle space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between text-text-muted">
                  <span>Base Model:</span>
                  <span className="text-text-main font-semibold truncate max-w-[180px]">
                    {selectedExp.base_model}
                  </span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Status:</span>
                  <span className="text-status-success font-semibold">{selectedExp.status}</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Final Loss:</span>
                  <span className="text-accent-secondary font-semibold">
                    {selectedExp.train_loss !== null ? selectedExp.train_loss.toFixed(4) : 'N/A'}
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isGenerating || experiments.length === 0}
              className="w-full py-3 bg-accent-primary hover:bg-accent-primary/90 text-white font-bold rounded-xl text-xs shadow-md shadow-accent-primary/20 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isGenerating ? 'Synthesizing Report Document...' : `Generate ${reportFormat.toUpperCase()} Report`}
            </button>
          </form>
        </div>

        {/* Right: Download Card & Report Schema Preview */}
        <div className="lg:col-span-7 space-y-6">
          {generatedReport ? (
            <div className="bg-bg-card border border-accent-primary/40 rounded-xl p-6 space-y-6 animate-in fade-in duration-150 shadow-xl shadow-accent-primary/5">
              <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
                <CheckCircle2 className="w-6 h-6 text-status-success" />
                <div>
                  <h3 className="font-bold text-base text-text-main">
                    Report Successfully Generated!
                  </h3>
                  <p className="text-xs text-text-muted">
                    Report ID: <span className="font-mono">{generatedReport.report_id}</span>
                  </p>
                </div>
              </div>

              <div className="bg-bg-elevated p-4 rounded-xl border border-border-subtle space-y-3">
                <p className="text-xs text-text-muted leading-relaxed">
                  Your official technical report has been compiled and saved to local storage. It incorporates full architectural documentation, hyperparameters, loss history, and academic conclusions.
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <a
                    href={generatedReport.download_url}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="px-5 py-2.5 bg-status-success hover:bg-status-success/90 text-bg-main font-bold rounded-lg text-xs shadow-md flex items-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download {generatedReport.format.toUpperCase()} Document
                  </a>
                </div>
              </div>

              <div className="text-[11px] text-text-muted flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-accent-secondary" />
                <span>Publication-Grade Artifact • Prepared by NEXORA LLM Engine</span>
              </div>
            </div>
          ) : (
            <div className="bg-bg-card border border-border-dark rounded-xl p-8 space-y-4">
              <h3 className="font-bold text-sm text-text-main border-b border-border-subtle pb-3">
                Included Report Sections
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-bg-elevated rounded-lg border border-border-subtle space-y-1">
                  <p className="font-bold text-accent-primary">1. Project & Architecture</p>
                  <p className="text-[11px] text-text-muted">Overview of base weights and zero-cost local CPU constraints.</p>
                </div>
                <div className="p-3 bg-bg-elevated rounded-lg border border-border-subtle space-y-1">
                  <p className="font-bold text-accent-secondary">2. LoRA Hyperparameters</p>
                  <p className="text-[11px] text-text-muted">Tabulated LoRA rank, alpha, dropout, learning rate, and batch size.</p>
                </div>
                <div className="p-3 bg-bg-elevated rounded-lg border border-border-subtle space-y-1">
                  <p className="font-bold text-status-warning">3. Loss Trajectory</p>
                  <p className="text-[11px] text-text-muted">Empirical cross-entropy step loss log from step 1 to convergence.</p>
                </div>
                <div className="p-3 bg-bg-elevated rounded-lg border border-border-subtle space-y-1">
                  <p className="font-bold text-status-success">4. Quantitative Evaluation</p>
                  <p className="text-[11px] text-text-muted">ROUGE-1, ROUGE-2, ROUGE-L, Perplexity, and Token F1 scores.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
