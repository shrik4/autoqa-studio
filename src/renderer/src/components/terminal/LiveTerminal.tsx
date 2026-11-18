import React, { useRef, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  Trash2,
  Search,
  ArrowDownCircle,
  Copy,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useTerminalStore } from '../../stores/useTerminalStore';
import { LogLevel } from '../../../../common/types';

export const LiveTerminal: React.FC = () => {
  const {
    logs,
    filterLevel,
    searchTerm,
    isAutoScroll,
    isDockOpen,
    dockHeight,
    clearLogs,
    setFilterLevel,
    setSearchTerm,
    setAutoScroll,
    toggleDock,
    setDockHeight,
  } = useTerminalStore();

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new logs
  useEffect(() => {
    if (isAutoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isAutoScroll]);

  // Filter logs based on level and search query
  const filteredLogs = logs.filter((log) => {
    const matchesLevel = filterLevel === 'ALL' || log.level === filterLevel;
    const matchesSearch =
      !searchTerm ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const getLevelBadge = (level: LogLevel) => {
    switch (level) {
      case 'SUCCESS':
        return <span className="text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded text-[10px]">SUCCESS</span>;
      case 'WARN':
        return <span className="text-amber-400 font-bold bg-amber-950/60 px-1.5 py-0.5 rounded text-[10px]">WARN</span>;
      case 'ERROR':
        return <span className="text-rose-400 font-bold bg-rose-950/60 px-1.5 py-0.5 rounded text-[10px]">ERROR</span>;
      case 'ACTION':
        return <span className="text-sky-400 font-bold bg-sky-950/60 px-1.5 py-0.5 rounded text-[10px]">ACTION</span>;
      case 'INFO':
      default:
        return <span className="text-cyan-400 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded text-[10px]">INFO</span>;
    }
  };

  const copyAllLogs = () => {
    const text = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.level}] [${l.category}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
  };

  if (!isDockOpen) {
    return (
      <div className="h-8 bg-[#070a11] border-t border-slate-800 flex items-center justify-between px-3 text-xs text-slate-400">
        <button
          onClick={toggleDock}
          className="flex items-center gap-2 hover:text-cyan-400 transition-colors"
        >
          <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono text-xs">Terminal Minimized ({logs.length} events)</span>
          <ChevronUp className="w-3.5 h-3.5 ml-1" />
        </button>
      </div>
    );
  }

  const isExpandedMax = dockHeight > 450;

  return (
    <div
      style={{ height: `${dockHeight}px` }}
      className="bg-[#070a12] border-t border-slate-800 flex flex-col font-mono text-xs z-30 shadow-2xl transition-all"
    >
      {/* Terminal Toolbar */}
      <div className="h-9 bg-[#0b0f1a] border-b border-slate-800/80 px-3 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
            <TerminalIcon className="w-4 h-4 text-cyan-400" />
            <span>LIVE TERMINAL</span>
            <span className="text-[10px] text-slate-400 font-normal">({filteredLogs.length} events)</span>
          </div>

          {/* Level Filter Pills */}
          <div className="hidden sm:flex items-center gap-1 ml-2">
            {(['ALL', 'INFO', 'SUCCESS', 'WARN', 'ERROR', 'ACTION'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  filterLevel === lvl
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900/80 border border-slate-700/60 rounded pl-7 pr-2 py-1 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 w-36 sm:w-44"
            />
          </div>

          {/* Auto Scroll Toggle */}
          <button
            onClick={() => setAutoScroll(!isAutoScroll)}
            className={`p-1 rounded hover:bg-slate-800 transition-colors ${
              isAutoScroll ? 'text-cyan-400' : 'text-slate-500'
            }`}
            title={isAutoScroll ? 'Auto-scroll: ON' : 'Auto-scroll: OFF'}
          >
            <ArrowDownCircle className="w-4 h-4" />
          </button>

          {/* Copy Logs */}
          <button
            onClick={copyAllLogs}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Copy Logs to Clipboard"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Clear Logs */}
          <button
            onClick={clearLogs}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
            title="Clear Terminal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Resize / Maximize */}
          <button
            onClick={() => setDockHeight(isExpandedMax ? 260 : 500)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title={isExpandedMax ? 'Restore Size' : 'Expand Terminal'}
          >
            {isExpandedMax ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Close / Minimize Dock */}
          <button
            onClick={toggleDock}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Minimize Dock"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal Output Log Stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-[11px] leading-relaxed bg-[#05080f]"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-slate-500 italic py-4 text-center">
            No matching log events in terminal.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2 hover:bg-slate-900/40 px-1 py-0.5 rounded transition-colors group"
            >
              <span className="text-slate-500 shrink-0 select-none text-[10px]">
                {log.timestamp}
              </span>
              <span className="shrink-0">{getLevelBadge(log.level)}</span>
              <span className="text-slate-400 font-semibold shrink-0 text-[10px] px-1 bg-slate-800/40 rounded">
                [{log.category}]
              </span>
              <span className="text-slate-200 break-all select-text flex-1">
                {log.message}
              </span>
              {log.screenshotUrl && (
                <span className="text-cyan-400 text-[10px] underline cursor-pointer shrink-0">
                  view snapshot
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
