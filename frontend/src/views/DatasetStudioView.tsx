import React, { useState } from 'react';
import {
  Database,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Split,
  Sparkles,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  Layers,
  ArrowRight
} from 'lucide-react';
import { DatasetMetadata, DatasetPreview } from '../types';
import {
  uploadDataset,
  getDatasetDetail,
  validateDataset,
  preprocessDataset,
  splitDataset,
  seedSampleDatasets
} from '../api/client';

interface DatasetStudioViewProps {
  datasets: DatasetMetadata[];
  onRefreshDatasets: () => void;
  onNavigateToTraining: () => void;
}

export const DatasetStudioView: React.FC<DatasetStudioViewProps> = ({
  datasets,
  onRefreshDatasets,
  onNavigateToTraining,
}) => {
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(
    datasets[0]?.id || null
  );
  const [previewData, setPreviewData] = useState<DatasetPreview | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'validate' | 'preprocess' | 'split'>('preview');
  const [isUploading, setIsUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Preprocessing and splitting state
  const [formatType, setFormatType] = useState('instruction');
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [dropEmpty, setDropEmpty] = useState(true);
  const [trainRatio, setTrainRatio] = useState(0.8);

  const selectedDataset = datasets.find((d) => d.id === selectedDatasetId) || datasets[0];

  const loadPreview = async (id: string) => {
    try {
      setSelectedDatasetId(id);
      const res = await getDatasetDetail(id);
      setPreviewData(res.preview);
    } catch (err: any) {
      console.error('Failed to load dataset preview', err);
    }
  };

  React.useEffect(() => {
    if (selectedDatasetId) {
      loadPreview(selectedDatasetId);
    } else if (datasets.length > 0) {
      loadPreview(datasets[0].id);
    }
  }, [selectedDatasetId, datasets.length]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setStatusMsg({ text: `Uploading ${file.name}...`, type: 'success' });
      const meta = await uploadDataset(file);
      setStatusMsg({ text: `Dataset ${file.name} uploaded successfully!`, type: 'success' });
      onRefreshDatasets();
      setSelectedDatasetId(meta.id);
    } catch (err: any) {
      setStatusMsg({
        text: err.response?.data?.detail || 'Failed to upload dataset file.',
        type: 'error',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleValidate = async () => {
    if (!selectedDataset) return;
    try {
      setStatusMsg({ text: 'Validating dataset format...', type: 'success' });
      await validateDataset(selectedDataset.id);
      setStatusMsg({ text: 'Dataset validation complete!', type: 'success' });
      onRefreshDatasets();
      loadPreview(selectedDataset.id);
    } catch (err: any) {
      setStatusMsg({ text: 'Validation failed.', type: 'error' });
    }
  };

  const handlePreprocess = async () => {
    if (!selectedDataset) return;
    try {
      setStatusMsg({ text: 'Cleaning and standardizing dataset...', type: 'success' });
      await preprocessDataset(selectedDataset.id, {
        format_type: formatType,
        remove_duplicates: removeDuplicates,
        drop_empty: dropEmpty,
      });
      setStatusMsg({ text: 'Dataset standardized and preprocessed successfully!', type: 'success' });
      onRefreshDatasets();
      loadPreview(selectedDataset.id);
    } catch (err: any) {
      setStatusMsg({ text: 'Preprocessing failed.', type: 'error' });
    }
  };

  const handleSplit = async () => {
    if (!selectedDataset) return;
    try {
      setStatusMsg({ text: 'Generating Train / Validation split...', type: 'success' });
      await splitDataset(selectedDataset.id, {
        train_ratio: trainRatio,
        val_ratio: 1 - trainRatio,
        seed: 42,
      });
      setStatusMsg({ text: `Dataset successfully split (${trainRatio * 100}% Train / ${(1 - trainRatio) * 100}% Val)!`, type: 'success' });
      onRefreshDatasets();
      loadPreview(selectedDataset.id);
    } catch (err: any) {
      setStatusMsg({ text: 'Splitting failed.', type: 'error' });
    }
  };

  const handleSeedSamples = async () => {
    try {
      setStatusMsg({ text: 'Seeding built-in academic datasets...', type: 'success' });
      await seedSampleDatasets();
      setStatusMsg({ text: 'Sample datasets seeded successfully!', type: 'success' });
      onRefreshDatasets();
    } catch (err: any) {
      setStatusMsg({ text: 'Failed to seed sample datasets.', type: 'error' });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border-dark">
        <div>
          <h2 className="text-2xl font-black text-text-main tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-accent-secondary" />
            Dataset Studio
          </h2>
          <p className="text-sm text-text-muted mt-1">
            Upload, inspect, validate, clean, and split instruction/conversational datasets for LoRA training.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSeedSamples}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-bg-elevated hover:bg-bg-elevated/70 border border-border-dark text-text-muted hover:text-text-main text-xs font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent-secondary" />
            Load Sample Datasets
          </button>

          <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-primary hover:bg-accent-primary/90 text-white font-semibold text-xs shadow-md shadow-accent-primary/20 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? 'Uploading...' : 'Upload File (.jsonl, .json, .csv)'}</span>
            <input
              type="file"
              accept=".csv,.json,.jsonl"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between border ${
            statusMsg.type === 'success'
              ? 'bg-status-success/15 border-status-success/30 text-status-success'
              : 'bg-status-error/15 border-status-error/30 text-status-error'
          }`}
        >
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="underline text-[10px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Studio Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Dataset List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-text-muted uppercase font-semibold px-1">
            <span>Available Datasets ({datasets.length})</span>
            <button onClick={onRefreshDatasets} className="hover:text-text-main flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {datasets.map((ds) => {
              const isSelected = selectedDataset?.id === ds.id;
              return (
                <div
                  key={ds.id}
                  onClick={() => loadPreview(ds.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-bg-card border-accent-secondary shadow-md shadow-accent-secondary/10'
                      : 'bg-bg-card/60 hover:bg-bg-card border-border-dark'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-text-main text-sm truncate max-w-[180px]">
                        {ds.name}
                      </h4>
                      <p className="text-[11px] font-mono text-text-muted mt-0.5">{ds.filename}</p>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-bg-elevated text-accent-secondary font-bold">
                      {ds.file_format}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-text-muted">
                    <span>{ds.sample_count} samples</span>
                    {ds.split_train_path ? (
                      <span className="text-status-success flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Split Ready
                      </span>
                    ) : (
                      <span className="text-text-muted/60">Not Split</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Dataset Workspace & Tabs */}
        <div className="lg:col-span-8 bg-bg-card border border-border-dark rounded-xl p-6 space-y-6">
          {selectedDataset ? (
            <>
              {/* Dataset Title & Meta Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border-subtle gap-3">
                <div>
                  <h3 className="font-bold text-lg text-text-main">{selectedDataset.name}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted mt-1 font-mono">
                    <span>Format: {selectedDataset.file_format.toUpperCase()}</span>
                    <span>•</span>
                    <span>Rows: {selectedDataset.sample_count}</span>
                    <span>•</span>
                    <span>Cols: [{selectedDataset.column_names?.join(', ') || 'N/A'}]</span>
                  </div>
                </div>

                <button
                  onClick={onNavigateToTraining}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-status-warning/20 hover:bg-status-warning/30 border border-status-warning/40 text-status-warning text-xs font-semibold transition-colors"
                >
                  Use for Fine-Tuning <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Sub-Tabs */}
              <div className="flex border-b border-border-subtle space-x-2 text-xs">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`pb-2.5 px-3 font-semibold transition-colors flex items-center gap-1.5 border-b-2 ${
                    activeTab === 'preview'
                      ? 'border-accent-secondary text-accent-secondary'
                      : 'border-transparent text-text-muted hover:text-text-main'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" /> Preview Records
                </button>
                <button
                  onClick={() => setActiveTab('validate')}
                  className={`pb-2.5 px-3 font-semibold transition-colors flex items-center gap-1.5 border-b-2 ${
                    activeTab === 'validate'
                      ? 'border-accent-secondary text-accent-secondary'
                      : 'border-transparent text-text-muted hover:text-text-main'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Format Validation
                </button>
                <button
                  onClick={() => setActiveTab('preprocess')}
                  className={`pb-2.5 px-3 font-semibold transition-colors flex items-center gap-1.5 border-b-2 ${
                    activeTab === 'preprocess'
                      ? 'border-accent-secondary text-accent-secondary'
                      : 'border-transparent text-text-muted hover:text-text-main'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Clean & Preprocess
                </button>
                <button
                  onClick={() => setActiveTab('split')}
                  className={`pb-2.5 px-3 font-semibold transition-colors flex items-center gap-1.5 border-b-2 ${
                    activeTab === 'split'
                      ? 'border-accent-secondary text-accent-secondary'
                      : 'border-transparent text-text-muted hover:text-text-main'
                  }`}
                >
                  <Split className="w-3.5 h-3.5" /> Train / Val Split
                </button>
              </div>

              {/* TAB CONTENT: Preview */}
              {activeTab === 'preview' && (
                <div className="space-y-4">
                  <p className="text-xs text-text-muted">
                    Showing first {previewData?.rows.length || 0} sample rows from disk:
                  </p>
                  <div className="max-h-96 overflow-auto border border-border-subtle rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-bg-elevated text-text-muted uppercase text-[10px] font-semibold sticky top-0">
                        <tr>
                          <th className="p-2.5 border-b border-border-subtle w-10">#</th>
                          {previewData?.columns.map((col) => (
                            <th key={col} className="p-2.5 border-b border-border-subtle font-mono">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                        {previewData?.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-bg-elevated/30">
                            <td className="p-2.5 font-mono text-text-muted text-[10px]">{idx + 1}</td>
                            {previewData.columns.map((col) => (
                              <td key={col} className="p-2.5 text-text-main font-mono text-[11px] max-w-xs truncate">
                                {typeof row[col] === 'object'
                                  ? JSON.stringify(row[col])
                                  : String(row[col] ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: Validation */}
              {activeTab === 'validate' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-text-main text-sm">Schema & Format Integrity</h4>
                      <p className="text-xs text-text-muted">
                        Validates that instruction/input/output or messages conform to fine-tuning requirements.
                      </p>
                    </div>
                    <button
                      onClick={handleValidate}
                      className="px-4 py-2 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-lg text-xs font-semibold shadow-sm"
                    >
                      Run Full Validation
                    </button>
                  </div>

                  {selectedDataset.validation_summary && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-bg-elevated p-3 rounded-lg border border-border-subtle">
                        <span className="text-[10px] text-text-muted block">Valid Samples</span>
                        <span className="text-lg font-mono font-bold text-status-success mt-0.5 block">
                          {selectedDataset.validation_summary.valid_samples ?? '-'}
                        </span>
                      </div>
                      <div className="bg-bg-elevated p-3 rounded-lg border border-border-subtle">
                        <span className="text-[10px] text-text-muted block">Invalid Samples</span>
                        <span className="text-lg font-mono font-bold text-status-error mt-0.5 block">
                          {selectedDataset.validation_summary.invalid_samples ?? '0'}
                        </span>
                      </div>
                      <div className="bg-bg-elevated p-3 rounded-lg border border-border-subtle">
                        <span className="text-[10px] text-text-muted block">Duplicates</span>
                        <span className="text-lg font-mono font-bold text-status-warning mt-0.5 block">
                          {selectedDataset.validation_summary.duplicates ?? '0'}
                        </span>
                      </div>
                      <div className="bg-bg-elevated p-3 rounded-lg border border-border-subtle">
                        <span className="text-[10px] text-text-muted block">Empty Fields</span>
                        <span className="text-lg font-mono font-bold text-text-muted mt-0.5 block">
                          {selectedDataset.validation_summary.empty_fields ?? '0'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: Preprocess */}
              {activeTab === 'preprocess' && (
                <div className="space-y-5">
                  <div>
                    <h4 className="font-bold text-text-main text-sm">Dataset Cleaning & Normalization</h4>
                    <p className="text-xs text-text-muted">
                      Standardize column keys, drop empty instruction records, and deduplicate identical pairs.
                    </p>
                  </div>

                  <div className="space-y-3 bg-bg-elevated/40 p-4 rounded-xl border border-border-subtle text-xs">
                    <div>
                      <label className="text-text-muted block mb-1 font-medium">Standard Target Format:</label>
                      <select
                        value={formatType}
                        onChange={(e) => setFormatType(e.target.value)}
                        className="bg-bg-elevated border border-border-subtle rounded-lg py-1.5 px-3 text-text-main focus:outline-none"
                      >
                        <option value="instruction">Instruction-Input-Output (Alpaca style)</option>
                        <option value="chat">Conversational (OpenAI / HuggingFace chat messages)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="dedup"
                        checked={removeDuplicates}
                        onChange={(e) => setRemoveDuplicates(e.target.checked)}
                        className="rounded border-border-subtle text-accent-primary"
                      />
                      <label htmlFor="dedup" className="text-text-main cursor-pointer">
                        Remove exact duplicate prompts and responses
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="dropempty"
                        checked={dropEmpty}
                        onChange={(e) => setDropEmpty(e.target.checked)}
                        className="rounded border-border-subtle text-accent-primary"
                      />
                      <label htmlFor="dropempty" className="text-text-main cursor-pointer">
                        Drop rows with empty instructions or empty target outputs
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handlePreprocess}
                    className="px-5 py-2.5 bg-accent-secondary hover:bg-accent-secondary/90 text-bg-main font-bold rounded-lg text-xs shadow-md transition-colors"
                  >
                    Execute Cleaning & Save Processed File
                  </button>
                </div>
              )}

              {/* TAB CONTENT: Split */}
              {activeTab === 'split' && (
                <div className="space-y-5">
                  <div>
                    <h4 className="font-bold text-text-main text-sm">Train / Validation Split Generator</h4>
                    <p className="text-xs text-text-muted">
                      Splits the dataset into independent training and validation subsets for unbiased loss tracking.
                    </p>
                  </div>

                  <div className="space-y-3 bg-bg-elevated/40 p-4 rounded-xl border border-border-subtle text-xs">
                    <div>
                      <div className="flex justify-between text-text-muted mb-1">
                        <span>Train Split Ratio:</span>
                        <span className="font-mono text-accent-secondary font-bold">
                          {(trainRatio * 100).toFixed(0)}% Train / {((1 - trainRatio) * 100).toFixed(0)}% Val
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="0.95"
                        step="0.05"
                        value={trainRatio}
                        onChange={(e) => setTrainRatio(parseFloat(e.target.value))}
                        className="w-full accent-accent-secondary cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 text-center font-mono">
                      <div className="bg-bg-card p-3 rounded-lg border border-border-subtle">
                        <span className="text-text-muted text-[10px] block">Estimated Train Samples</span>
                        <span className="text-accent-secondary font-bold text-base mt-0.5 block">
                          {Math.max(1, Math.floor(selectedDataset.sample_count * trainRatio))}
                        </span>
                      </div>
                      <div className="bg-bg-card p-3 rounded-lg border border-border-subtle">
                        <span className="text-text-muted text-[10px] block">Estimated Val Samples</span>
                        <span className="text-accent-primary font-bold text-base mt-0.5 block">
                          {Math.max(1, selectedDataset.sample_count - Math.floor(selectedDataset.sample_count * trainRatio))}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSplit}
                    className="px-5 py-2.5 bg-accent-primary hover:bg-accent-primary/90 text-white font-bold rounded-lg text-xs shadow-md transition-colors"
                  >
                    Generate & Save Train/Val Splits
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 text-text-muted text-xs">
              Select or upload a dataset to begin exploration.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
