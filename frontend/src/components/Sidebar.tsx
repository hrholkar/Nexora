import React from 'react';
import {
  LayoutDashboard,
  Box,
  Database,
  Flame,
  MessageSquare,
  Columns,
  BarChart2,
  ListTree,
  FileText,
  Settings,
  Sparkles,
  ExternalLink,
  Cpu
} from 'lucide-react';
import { Logo } from './Logo';

export type NavItemKey =
  | 'landing'
  | 'dashboard'
  | 'models'
  | 'datasets'
  | 'training'
  | 'playground'
  | 'comparison'
  | 'evaluation'
  | 'experiments'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentView: NavItemKey;
  onSelectView: (view: NavItemKey) => void;
  mlEngineOnline: boolean;
  activeModelName?: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  mlEngineOnline,
  activeModelName
}) => {
  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'models', label: 'Model Hub', icon: Box },
    { key: 'datasets', label: 'Dataset Studio', icon: Database },
    { key: 'training', label: 'Fine-Tuning', icon: Flame, badge: 'LoRA' },
    { key: 'playground', label: 'LLM Playground', icon: MessageSquare },
    { key: 'comparison', label: 'Model Comparison', icon: Columns },
    { key: 'evaluation', label: 'Evaluation', icon: BarChart2 },
    { key: 'experiments', label: 'Experiments', icon: ListTree },
    { key: 'reports', label: 'Reports', icon: FileText },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-bg-sidebar border-r border-border-dark flex flex-col h-screen select-none shrink-0 z-20">
      {/* Brand Header */}
      <div 
        className="p-5 border-b border-border-dark cursor-pointer hover:bg-bg-elevated/40 transition-colors"
        onClick={() => onSelectView('landing')}
      >
        <Logo size={36} />
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <button
          onClick={() => onSelectView('landing')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            currentView === 'landing'
              ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30'
              : 'text-text-muted hover:text-text-main hover:bg-bg-card'
          }`}
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-accent-secondary" />
            <span>Platform Overview</span>
          </div>
        </button>

        <div className="pt-2 pb-1 px-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted/60">
            LLM Workflow
          </p>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSelectView(item.key as NavItemKey)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-accent-primary text-white shadow-md shadow-accent-primary/25 font-semibold'
                  : 'text-text-muted hover:text-text-main hover:bg-bg-card'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-text-muted'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-accent-primary/10 text-accent-primary border border-accent-primary/20'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Engine & Active Model Status Footer */}
      <div className="p-4 border-t border-border-dark bg-bg-card/40 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-accent-secondary" />
            Local ML Engine:
          </span>
          <span
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${
              mlEngineOnline
                ? 'bg-status-success/15 text-status-success border border-status-success/30'
                : 'bg-status-warning/15 text-status-warning border border-status-warning/30'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                mlEngineOnline ? 'bg-status-success animate-pulse' : 'bg-status-warning'
              }`}
            />
            {mlEngineOnline ? 'Ready (CPU)' : 'Standby'}
          </span>
        </div>

        {activeModelName && (
          <div className="text-[11px] bg-bg-elevated/70 border border-border-subtle p-2 rounded-md">
            <p className="text-text-muted truncate">Active Model in RAM:</p>
            <p className="font-mono text-accent-secondary font-medium truncate">
              {activeModelName}
            </p>
          </div>
        )}

        <div className="pt-1 flex items-center justify-between text-[11px] text-text-muted/70">
          <span>Harsh Holkar</span>
          <a
            href="https://github.com/hrholkar/Nexora"
            target="_blank"
            rel="noreferrer"
            className="hover:text-accent-primary flex items-center gap-0.5"
          >
            GitHub <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </aside>
  );
};
