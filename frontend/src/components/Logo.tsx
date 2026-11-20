import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 32, showText = true }) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div 
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary p-1.5 shadow-lg shadow-accent-primary/20"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-white"
        >
          {/* Neural Synapse Connections */}
          <line x1="10" y1="12" x2="20" y2="20" stroke="white" strokeWidth="2.5" strokeOpacity="0.8" />
          <line x1="10" y1="28" x2="20" y2="20" stroke="white" strokeWidth="2.5" strokeOpacity="0.8" />
          <line x1="20" y1="20" x2="30" y2="12" stroke="white" strokeWidth="2.5" strokeOpacity="0.8" />
          <line x1="20" y1="20" x2="30" y2="28" stroke="white" strokeWidth="2.5" strokeOpacity="0.8" />
          <line x1="10" y1="12" x2="10" y2="28" stroke="white" strokeWidth="1.5" strokeDasharray="2 2" strokeOpacity="0.4" />
          <line x1="30" y1="12" x2="30" y2="28" stroke="white" strokeWidth="1.5" strokeDasharray="2 2" strokeOpacity="0.4" />

          {/* Neural Nodes */}
          <circle cx="10" cy="12" r="3.5" fill="#38BDF8" />
          <circle cx="10" cy="28" r="3.5" fill="#38BDF8" />
          <circle cx="20" cy="20" r="5" fill="#FFFFFF" />
          <circle cx="30" cy="12" r="3.5" fill="#C084FC" />
          <circle cx="30" cy="28" r="3.5" fill="#C084FC" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-extrabold tracking-wider text-text-main text-lg leading-tight flex items-center gap-1.5">
            NEXORA
            <span className="text-[10px] uppercase font-semibold tracking-wider bg-accent-primary/20 text-accent-primary border border-accent-primary/30 px-1.5 py-0.5 rounded-full">
              LLM LAB
            </span>
          </span>
          <span className="text-[10px] text-text-muted tracking-tight font-medium">
            Where Language Models Evolve
          </span>
        </div>
      )}
    </div>
  );
};
