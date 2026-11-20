import React, { useState } from 'react';
import { Activity, Server, Cpu, Layers, HardDrive } from 'lucide-react';
import { HealthStatus, HardwareInfo } from '../types';
import { HardwareModal } from './HardwareModal';

interface NavbarProps {
  currentViewTitle: string;
  health: HealthStatus | null;
  hardware: HardwareInfo | null;
  pingMs: number | null;
  onRefreshHardware: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentViewTitle,
  health,
  hardware,
  pingMs,
  onRefreshHardware,
}) => {
  const [showHardwareModal, setShowHardwareModal] = useState(false);

  return (
    <>
      <header className="h-16 bg-bg-card/70 backdrop-blur-md border-b border-border-dark px-6 flex items-center justify-between z-10 sticky top-0">
        {/* Current View Title */}
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-text-main tracking-tight">
            {currentViewTitle}
          </h1>
          <span className="hidden md:inline-block text-xs px-2.5 py-0.5 rounded-full bg-bg-elevated border border-border-subtle text-text-muted">
            Academic LLM Engine
          </span>
        </div>

        {/* Live System Diagnostics Badges */}
        <div className="flex items-center gap-3">
          {/* Backend Connection Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-bg-elevated border border-border-dark text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                health?.status === 'healthy'
                  ? 'bg-status-success animate-pulse'
                  : 'bg-status-error'
              }`}
            />
            <span className="text-text-muted font-medium">Backend:</span>
            <span
              className={`font-semibold ${
                health?.status === 'healthy' ? 'text-status-success' : 'text-status-error'
              }`}
            >
              {health?.status === 'healthy' ? 'Connected' : 'Offline'}
            </span>
            {pingMs !== null && (
              <span className="text-[10px] text-text-muted font-mono ml-1">
                ({pingMs}ms)
              </span>
            )}
          </div>

          {/* Model Status in Memory */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-bg-elevated border border-border-dark text-xs">
            <Layers className="w-3.5 h-3.5 text-accent-primary" />
            <span className="text-text-muted">Model:</span>
            <span className="font-mono text-text-main font-medium max-w-[140px] truncate">
              {health?.active_model || 'None Loaded'}
            </span>
          </div>

          {/* Hardware Trigger Badge */}
          <button
            onClick={() => setShowHardwareModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-primary/10 hover:bg-accent-primary/20 border border-accent-primary/30 text-xs text-accent-primary transition-all font-medium"
            title="Inspect CPU, RAM and hardware details"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>
              {hardware
                ? `${hardware.device.toUpperCase()} (${hardware.cpu_usage_percent.toFixed(0)}% CPU)`
                : 'Hardware Info'}
            </span>
          </button>
        </div>
      </header>

      {showHardwareModal && (
        <HardwareModal
          hardware={hardware}
          onClose={() => setShowHardwareModal(false)}
          onRefresh={onRefreshHardware}
        />
      )}
    </>
  );
};
