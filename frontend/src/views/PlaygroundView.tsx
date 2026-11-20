import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Trash2,
  Copy,
  Check,
  Sliders,
  Sparkles,
  Zap,
  Clock,
  Layers,
  Bot,
  User,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { ModelCard, ExperimentSummary, InferenceResponse } from '../types';
import { runInference } from '../api/client';

interface PlaygroundViewProps {
  models: ModelCard[];
  experiments: ExperimentSummary[];
  mlEngineOnline: boolean;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  latency_ms?: number;
  tokens?: number;
  adapter_used?: string | null;
}

export const PlaygroundView: React.FC<PlaygroundViewProps> = ({
  models,
  experiments,
  mlEngineOnline,
}) => {
  const [selectedModel, setSelectedModel] = useState<string>(
    models[0]?.hf_repo || 'HuggingFaceTB/SmolLM2-360M-Instruct'
  );
  const [selectedAdapterId, setSelectedAdapterId] = useState<string>('');
  const [systemPrompt, setSystemPrompt] = useState<string>(
    'You are NEXORA, a helpful, precise AI assistant.'
  );
  const [temperature, setTemperature] = useState<number>(0.7);
  const [topP, setTopP] = useState<number>(0.9);
  const [topK, setTopK] = useState<number>(50);
  const [maxTokens, setMaxTokens] = useState<number>(128);

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Welcome to the NEXORA LLM Playground. Select a base model and optional trained LoRA adapter, then send a prompt to evaluate genuine inference.',
    },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const completedAdapters = experiments.filter((e) => e.status === 'COMPLETED' && e.adapter_path);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: inputPrompt.trim() };
    const newChatHistory = [...messages, userMsg];
    setMessages(newChatHistory);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const res: InferenceResponse = await runInference({
        model_name: selectedModel,
        adapter_id: selectedAdapterId || null,
        prompt: userMsg.content,
        system_prompt: systemPrompt,
        temperature,
        top_p: topP,
        top_k: topK,
        max_new_tokens: maxTokens,
        repetition_penalty: 1.1,
      });

      setMessages([
        ...newChatHistory,
        {
          role: 'assistant',
          content: res.generated_text || '(Empty generation response)',
          latency_ms: res.latency_ms,
          tokens: res.completion_tokens,
          adapter_used: res.adapter_used,
        },
      ]);
    } catch (err: any) {
      setMessages([
        ...newChatHistory,
        {
          role: 'assistant',
          content: `Inference Error: ${
            err.response?.data?.detail ||
            'Could not communicate with local ML engine. Ensure backend is running locally with loaded model weights.'
          }`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Chat cleared. Ready for your prompt.',
      },
    ]);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border-dark">
        <div>
          <h2 className="text-2xl font-black text-text-main tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-accent-primary" />
            LLM Inference Playground
          </h2>
          <p className="text-sm text-text-muted mt-1">
            Perform live inference against base pretrained models or custom LoRA adapters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-card hover:bg-bg-elevated border border-border-dark text-text-muted hover:text-text-main text-xs transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Chat
          </button>
        </div>
      </div>

      {/* Main Grid: Parameters Sidebar & Chat Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Model & Hyperparameter Settings */}
        <div className="lg:col-span-4 bg-bg-card border border-border-dark rounded-xl p-5 space-y-5 text-xs">
          <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
            <Sliders className="w-4 h-4 text-accent-secondary" />
            <h3 className="font-bold text-text-main">Generation Parameters</h3>
          </div>

          {/* Model Selector */}
          <div className="space-y-1.5">
            <label className="text-text-muted font-medium block">Base Pretrained Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-bg-elevated border border-border-subtle rounded-lg py-2 px-3 text-text-main font-mono focus:outline-none focus:border-accent-primary"
            >
              {models.map((m) => (
                <option key={m.id} value={m.hf_repo}>
                  {m.name} ({m.parameters})
                </option>
              ))}
            </select>
          </div>

          {/* Adapter Selector */}
          <div className="space-y-1.5">
            <label className="text-text-muted font-medium block">LoRA Adapter (Optional)</label>
            <select
              value={selectedAdapterId}
              onChange={(e) => setSelectedAdapterId(e.target.value)}
              className="w-full bg-bg-elevated border border-border-subtle rounded-lg py-2 px-3 text-text-main font-mono focus:outline-none focus:border-accent-primary"
            >
              <option value="">None (Use Base Model Weights)</option>
              {completedAdapters.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (Loss: {a.train_loss?.toFixed(3) || 'N/A'})
                </option>
              ))}
            </select>
          </div>

          {/* System Prompt */}
          <div className="space-y-1.5">
            <label className="text-text-muted font-medium block">System Prompt</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={2}
              className="w-full bg-bg-elevated border border-border-subtle rounded-lg p-2 text-text-main font-mono text-[11px] focus:outline-none focus:border-accent-primary"
            />
          </div>

          {/* Sliders */}
          <div className="space-y-4 pt-2 border-t border-border-subtle">
            <div>
              <div className="flex justify-between text-text-muted mb-1">
                <span>Temperature:</span>
                <span className="font-mono text-accent-secondary font-bold">{temperature}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.5"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-accent-secondary cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-text-muted mb-1">
                <span>Top-P (Nucleus Sampling):</span>
                <span className="font-mono text-accent-secondary font-bold">{topP}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={topP}
                onChange={(e) => setTopP(parseFloat(e.target.value))}
                className="w-full accent-accent-secondary cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-text-muted mb-1">
                <span>Max Output Tokens:</span>
                <span className="font-mono text-accent-secondary font-bold">{maxTokens}</span>
              </div>
              <input
                type="range"
                min="32"
                max="512"
                step="16"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full accent-accent-secondary cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right: Chat Stream Canvas */}
        <div className="lg:col-span-8 bg-bg-card border border-border-dark rounded-xl flex flex-col h-[650px] overflow-hidden">
          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 text-xs leading-relaxed ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-accent-primary/20 border border-accent-primary/30 flex items-center justify-center text-accent-primary shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-xl rounded-xl p-4 space-y-2 ${
                    msg.role === 'user'
                      ? 'bg-accent-primary text-white font-medium rounded-tr-none'
                      : 'bg-bg-elevated border border-border-subtle text-text-main rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap font-sans text-xs">{msg.content}</p>

                  {/* Assistant Footer Telemetry */}
                  {msg.role === 'assistant' && msg.latency_ms && (
                    <div className="pt-2 border-t border-border-subtle/60 flex items-center justify-between text-[10px] text-text-muted font-mono">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-accent-secondary" />
                          {msg.latency_ms} ms
                        </span>
                        {msg.tokens && <span>• {msg.tokens} tokens</span>}
                        {msg.tokens && msg.latency_ms && (
                          <span>
                            • {((msg.tokens / (msg.latency_ms / 1000))).toFixed(1)} t/s
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleCopy(msg.content, idx)}
                        className="hover:text-text-main flex items-center gap-1"
                        title="Copy text"
                      >
                        {copiedIdx === idx ? (
                          <Check className="w-3 h-3 text-status-success" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-bg-elevated border border-border-subtle flex items-center justify-center text-text-muted shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-3 text-xs text-text-muted animate-pulse">
                <div className="w-7 h-7 rounded-lg bg-accent-primary/20 flex items-center justify-center text-accent-primary shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-bg-elevated border border-border-subtle p-3 rounded-xl rounded-tl-none">
                  Generating inference tokens on CPU...
                </div>
              </div>
            )}
          </div>

          {/* Prompt Input Form */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 border-t border-border-dark bg-bg-elevated/40 flex items-center gap-3"
          >
            <input
              type="text"
              placeholder="Ask a question or provide an instruction (e.g. 'Solve 3x + 9 = 24' or 'Explain LoRA')..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-bg-elevated border border-border-subtle rounded-xl py-2.5 px-4 text-xs text-text-main placeholder-text-muted/60 focus:outline-none focus:border-accent-primary"
            />
            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="px-4 py-2.5 bg-accent-primary hover:bg-accent-primary/90 disabled:opacity-50 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-accent-primary/20 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
