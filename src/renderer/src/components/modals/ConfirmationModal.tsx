import React from 'react';
import { AlertTriangle, ShieldAlert, Check, X } from 'lucide-react';
import { useExecutionStore } from '../../stores/useExecutionStore';

export const ConfirmationModal: React.FC = () => {
  const { isConfirmationModalOpen, pendingConfirmationStep, closeConfirmation } = useExecutionStore();

  if (!isConfirmationModalOpen || !pendingConfirmationStep) return null;

  const handleConfirm = () => {
    window.api?.confirmAction?.(true);
    closeConfirmation();
  };

  const handleCancel = () => {
    window.api?.confirmAction?.(false);
    closeConfirmation();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-amber-500/50 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              Action Confirmation Required
              <span className="text-[10px] font-mono uppercase bg-amber-950 text-amber-400 border border-amber-800/60 px-2 py-0.5 rounded">
                Guardrail
              </span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The AI automation agent is about to execute a sensitive action. Please review and approve before continuing.
            </p>
          </div>
        </div>

        {/* Step details */}
        <div className="bg-[#090d16] border border-slate-800 rounded-lg p-3 space-y-2 font-mono text-xs">
          <div className="flex justify-between text-slate-400 border-b border-slate-800 pb-1">
            <span>Action Type:</span>
            <span className="text-cyan-400 font-semibold">{pendingConfirmationStep.action}</span>
          </div>
          <div className="text-slate-300">
            <span className="text-slate-500 block text-[10px] uppercase">Description</span>
            {pendingConfirmationStep.description}
          </div>
          {pendingConfirmationStep.params.selector && (
            <div className="text-slate-400">
              <span className="text-slate-500 block text-[10px] uppercase">Target Selector</span>
              <code className="text-amber-300 text-[11px]">{pendingConfirmationStep.params.selector}</code>
            </div>
          )}
          {pendingConfirmationStep.params.url && (
            <div className="text-slate-400">
              <span className="text-slate-500 block text-[10px] uppercase">Target URL</span>
              <code className="text-cyan-300 text-[11px]">{pendingConfirmationStep.params.url}</code>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-amber-400/90 bg-amber-950/20 p-2.5 rounded border border-amber-900/40">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>This safeguard ensures purchases, payments, and sensitive forms are never submitted autonomously.</span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Abort Action
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold transition-colors shadow-lg shadow-amber-500/20"
          >
            <Check className="w-3.5 h-3.5" />
            Authorize & Proceed
          </button>
        </div>
      </div>
    </div>
  );
};
