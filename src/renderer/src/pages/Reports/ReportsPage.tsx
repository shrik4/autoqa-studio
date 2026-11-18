import React, { useState } from 'react';
import {
  FileText,
  Download,
  FileCode,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Camera,
  Layers,
  FolderOpen,
} from 'lucide-react';
import { useTerminalStore } from '../../stores/useTerminalStore';

export const ReportsPage: React.FC = () => {
  const { addLog } = useTerminalStore();
  const [exportedFilePath, setExportedFilePath] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportHtml = async () => {
    setIsExporting(true);
    addLog({
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      level: 'ACTION',
      category: 'SYSTEM',
      message: 'Exporting QA test audit report as standalone interactive HTML...',
    });

    try {
      const res = await window.api?.exportReportHtml?.('latest');
      if (res?.success && res.filePath) {
        setExportedFilePath(res.filePath);
        addLog({
          id: (Date.now() + 1).toString(),
          timestamp: new Date().toLocaleTimeString(),
          level: 'SUCCESS',
          category: 'SYSTEM',
          message: `HTML report exported to: ${res.filePath}`,
        });
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    addLog({
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      level: 'ACTION',
      category: 'SYSTEM',
      message: 'Exporting QA test audit report as PDF document...',
    });

    try {
      const res = await window.api?.exportReportPdf?.('latest');
      if (res?.success && res.filePath) {
        setExportedFilePath(res.filePath);
        addLog({
          id: (Date.now() + 1).toString(),
          timestamp: new Date().toLocaleTimeString(),
          level: 'SUCCESS',
          category: 'SYSTEM',
          message: `PDF report exported to: ${res.filePath}`,
        });
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full flex flex-col">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            QA Audit Reports & Analytics
          </h1>
          <p className="text-xs text-slate-400">
            Export executive test summaries, step timelines, failure diagnostics, and AI recommendations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportHtml}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
          >
            <FileCode className="w-3.5 h-3.5" />
            Export HTML
          </button>
          <button
            onClick={handleExportPdf}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold transition-colors shadow-md shadow-cyan-500/20 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            Export PDF
          </button>
        </div>
      </div>

      {exportedFilePath && (
        <div className="bg-emerald-950/40 border border-emerald-800/60 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Report successfully exported to disk: <code className="font-mono text-white text-[11px]">{exportedFilePath}</code></span>
          </div>
          <span className="text-[11px] text-emerald-400 underline cursor-pointer flex items-center gap-1">
            <FolderOpen className="w-3.5 h-3.5" /> Opened in Explorer
          </span>
        </div>
      )}

      {/* Featured Sample Report Card */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl">
        {/* Report Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase bg-cyan-950 text-cyan-400 border border-cyan-800/60 px-2 py-0.5 rounded">
              Report ID: QA-REP-CURRENT
            </span>
            <h2 className="text-base font-bold text-slate-100">
              Flipkart Search & Product Inspection Verification Audit
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> 14.8 seconds duration
              </span>
              <span>•</span>
              <span className="font-mono text-[11px] text-slate-400">Target: flipkart.com</span>
            </div>
          </div>

          {/* Pass/Fail Matrix */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center min-w-[70px]">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Total</div>
              <div className="text-base font-bold text-slate-200">5</div>
            </div>
            <div className="p-3 bg-emerald-950/30 border border-emerald-900/40 rounded-lg text-center min-w-[70px]">
              <div className="text-[10px] text-emerald-400 uppercase font-mono">Passed</div>
              <div className="text-base font-bold text-emerald-400 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 5
              </div>
            </div>
            <div className="p-3 bg-rose-950/30 border border-rose-900/40 rounded-lg text-center min-w-[70px]">
              <div className="text-[10px] text-rose-400 uppercase font-mono">Failed</div>
              <div className="text-base font-bold text-rose-400 flex items-center justify-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> 0
              </div>
            </div>
          </div>
        </div>

        {/* AI Executive Analysis */}
        <div className="bg-[#070a12] border border-cyan-900/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>AI Executive Analysis & Quality Assessment</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The target search flow executed cleanly with zero network dropouts or unhandled JavaScript exceptions.
            Element locators for the search bar (<code>input[name="q"]</code>) resolved in 82ms. Auto-suggest results responded within acceptable performance thresholds (180ms), and 24 product card containers rendered with valid rupee pricing structures.
          </p>

          <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">AI Recommendations:</span>
            <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
              <li>Add explicit negative assertion testing for special characters in search input.</li>
              <li>Monitor lazy-loaded product image rendering speed on slower 3G throttled profiles.</li>
            </ul>
          </div>
        </div>

        {/* Steps and Evidence */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Execution Steps & Verification Evidence
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { step: '1. Launch & Navigate', detail: 'URL: https://www.flipkart.com', status: 'PASS' },
              { step: '2. Type Search Query', detail: 'Value: "iPhone 18"', status: 'PASS' },
              { step: '3. Inspect Search Grid', detail: 'Verified 24 product cards rendered', status: 'PASS' },
            ].map((s, i) => (
              <div key={i} className="p-3 rounded-lg bg-[#070a12] border border-slate-800 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{s.step}</span>
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950 px-1.5 py-0.2 rounded">
                    {s.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">{s.detail}</div>
                <div className="pt-2 flex items-center gap-1 text-[10px] text-cyan-400">
                  <Camera className="w-3 h-3" />
                  <span>Snapshot captured</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
