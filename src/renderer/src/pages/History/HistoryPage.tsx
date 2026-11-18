import React, { useEffect, useState } from 'react';
import {
  History as HistoryIcon,
  Search,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { ExecutionPlan } from '../../../../common/types';
import { useExecutionStore } from '../../stores/useExecutionStore';

export const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<ExecutionPlan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { setPlan, setStatus } = useExecutionStore();

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      if (window.api?.getHistory) {
        const runs = await window.api.getHistory();
        setHistory(runs || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClear = async () => {
    if (window.api?.clearHistory) {
      await window.api.clearHistory();
      setHistory([]);
    }
  };

  const handleReplay = (run: ExecutionPlan) => {
    setPlan(run);
    setStatus(run.status);
  };

  const filtered = history.filter(
    (h) =>
      !searchTerm ||
      h.goal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full flex flex-col">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-cyan-400" />
            Execution History & SQLite Storage
          </h1>
          <p className="text-xs text-slate-400">
            Persistent audit history of previous automation runs, step timelines, and execution metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All History
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search previous execution goals or run IDs..."
          className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
        />
      </div>

      {/* History Table */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-xl overflow-hidden flex-1 shadow-lg flex flex-col">
        {filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 space-y-3">
            <HistoryIcon className="w-12 h-12 text-slate-700" />
            <div className="text-xs font-medium text-slate-400">No execution history recorded</div>
            <p className="text-[11px] text-slate-500 max-w-sm text-center">
              Execute natural language commands in the AI Automation tab to save persistent runs to SQLite.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-[#070a12] text-slate-400 font-mono text-[11px]">
                  <th className="p-3.5">Run ID</th>
                  <th className="p-3.5">Instruction / Goal</th>
                  <th className="p-3.5">Steps</th>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {filtered.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3.5 text-cyan-400 font-semibold">{run.id}</td>
                    <td className="p-3.5 font-sans max-w-md truncate text-slate-200">
                      {run.goal}
                    </td>
                    <td className="p-3.5 text-slate-400">{run.steps?.length} steps</td>
                    <td className="p-3.5 text-slate-500 text-[11px]">
                      {run.createdAt ? new Date(run.createdAt).toLocaleString() : ''}
                    </td>
                    <td className="p-3.5">
                      {run.status === 'COMPLETED' ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-[10px] bg-emerald-950/60 px-2 py-0.5 rounded w-max border border-emerald-800/40">
                          <CheckCircle2 className="w-3 h-3" /> COMPLETED
                        </span>
                      ) : run.status === 'FAILED' ? (
                        <span className="flex items-center gap-1 text-rose-400 text-[10px] bg-rose-950/60 px-2 py-0.5 rounded w-max border border-rose-800/40">
                          <XCircle className="w-3 h-3" /> FAILED
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-400 text-[10px] bg-slate-800 px-2 py-0.5 rounded w-max">
                          <Clock className="w-3 h-3" /> {run.status}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right font-sans">
                      <button
                        onClick={() => handleReplay(run)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                        title="Load run details"
                      >
                        Load
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
