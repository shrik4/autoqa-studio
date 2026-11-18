import React, { useEffect, useState } from 'react';
import { Minus, Square, X, Bot, ShieldCheck } from 'lucide-react';
import { useExecutionStore } from '../../stores/useExecutionStore';

export const TitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const { status } = useExecutionStore();

  useEffect(() => {
    // Check initial window state if API is available
    if (window.api?.isMaximized) {
      window.api.isMaximized().then(setIsMaximized).catch(() => {});
    }
  }, []);

  const handleMinimize = () => {
    window.api?.minimize?.();
  };

  const handleMaximize = () => {
    window.api?.maximize?.();
    setIsMaximized(!isMaximized);
  };

  const handleClose = () => {
    window.api?.close?.();
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'PLANNING':
        return <span className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 animate-pulse"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>AI Planning</span>;
      case 'EXECUTING':
        return <span className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 animate-pulse"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Executing</span>;
      case 'PAUSED':
        return <span className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-950/80 text-amber-400 border border-amber-800/60"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>Paused</span>;
      case 'FAILED':
        return <span className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-rose-950/80 text-rose-400 border border-rose-800/60"><span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>Failed</span>;
      case 'COMPLETED':
        return <span className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Completed</span>;
      default:
        return <span className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/60"><span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>Ready</span>;
    }
  };

  return (
    <div className="titlebar-drag-region h-[38px] bg-[#070a11] border-b border-slate-800/80 flex items-center justify-between px-3 select-none z-50 text-slate-300">
      {/* Brand & Title */}
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-cyan-600 to-sky-400 flex items-center justify-center text-slate-950 shadow-sm">
          <Bot className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs tracking-wider text-slate-200">AUTOQA<span className="text-cyan-400">.STUDIO</span></span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">v1.0</span>
        </div>
        <div className="ml-3 titlebar-no-drag">
          {getStatusBadge()}
        </div>
      </div>

      {/* Security & System Info */}
      <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-[11px] font-mono text-slate-400">Sandboxed Context Isolation</span>
      </div>

      {/* Window Controls */}
      <div className="titlebar-no-drag flex items-center">
        <button
          onClick={handleMinimize}
          className="w-9 h-7 flex items-center justify-center hover:bg-slate-800/80 text-slate-400 hover:text-slate-100 transition-colors rounded-sm"
          title="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-9 h-7 flex items-center justify-center hover:bg-slate-800/80 text-slate-400 hover:text-slate-100 transition-colors rounded-sm"
          title="Maximize"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={handleClose}
          className="w-9 h-7 flex items-center justify-center hover:bg-rose-600 hover:text-white text-slate-400 transition-colors rounded-sm"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
