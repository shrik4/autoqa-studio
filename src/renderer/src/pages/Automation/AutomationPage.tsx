import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  Bot,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Globe,
  Camera,
  Layers,
} from 'lucide-react';
import { useExecutionStore } from '../../stores/useExecutionStore';
import { useTerminalStore } from '../../stores/useTerminalStore';
import { PlanStep } from '../../../../common/types';

export const AutomationPage: React.FC = () => {
  const {
    userInput,
    setUserInput,
    currentPlan,
    setPlan,
    status,
    setStatus,
    resetExecution,
  } = useExecutionStore();

  const { addLog } = useTerminalStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStart = async () => {
    if (!userInput.trim()) return;
    setIsSubmitting(true);
    setStatus('PLANNING');

    addLog({
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      level: 'INFO',
      category: 'AI_PLANNER',
      message: `Analyzing instruction: "${userInput}"`,
    });

    try {
      const res = await window.api?.startAutomation?.(userInput);
      if (res?.success && res.plan) {
        setPlan(res.plan);
        setStatus('EXECUTING');
        addLog({
          id: (Date.now() + 1).toString(),
          timestamp: new Date().toLocaleTimeString(),
          level: 'SUCCESS',
          category: 'AI_PLANNER',
          message: `Execution plan generated with ${res.plan.steps.length} sequential steps.`,
        });
      } else {
        setStatus('FAILED');
        addLog({
          id: (Date.now() + 2).toString(),
          timestamp: new Date().toLocaleTimeString(),
          level: 'ERROR',
          category: 'AI_PLANNER',
          message: res?.error || 'Failed to generate execution plan.',
        });
      }
    } catch (err: unknown) {
      setStatus('FAILED');
      addLog({
        id: (Date.now() + 3).toString(),
        timestamp: new Date().toLocaleTimeString(),
        level: 'ERROR',
        category: 'SYSTEM',
        message: err instanceof Error ? err.message : 'Unknown execution error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePause = async () => {
    await window.api?.pauseAutomation?.();
    setStatus('PAUSED');
  };

  const handleResume = async () => {
    await window.api?.resumeAutomation?.();
    setStatus('EXECUTING');
  };

  const handleStop = async () => {
    await window.api?.stopAutomation?.();
    setStatus('CANCELLED');
  };

  const getStepIcon = (step: PlanStep) => {
    switch (step.status) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'RUNNING':
        return <Clock className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />;
      case 'FAILED':
        return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'RETRYING':
        return <RotateCcw className="w-4 h-4 text-amber-400 animate-spin shrink-0" />;
      default:
        return <div className="w-2.5 h-2.5 rounded-full bg-slate-600 shrink-0 mx-0.5" />;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full flex flex-col">
      {/* Header & Controls bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Bot className="w-5 h-5 text-cyan-400" />
              AI Automation Agent
            </h1>
            <p className="text-xs text-slate-400">
              Provide natural language instructions for autonomous browser execution & verification.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {status === 'EXECUTING' ? (
              <button
                onClick={handlePause}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
              >
                <Pause className="w-3.5 h-3.5" />
                Pause
              </button>
            ) : status === 'PAUSED' ? (
              <button
                onClick={handleResume}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                Resume
              </button>
            ) : null}

            {['EXECUTING', 'PAUSED', 'PLANNING'].includes(status) && (
              <button
                onClick={handleStop}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-colors"
              >
                <Square className="w-3.5 h-3.5" />
                Stop
              </button>
            )}

            <button
              onClick={resetExecution}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
        </div>

        {/* Natural Language Prompt Input Bar */}
        <div className="relative flex flex-col sm:flex-row items-center gap-2 bg-[#0b0f19] border border-slate-800 p-2 rounded-xl focus-within:border-cyan-500/50 shadow-lg transition-colors">
          <div className="flex-1 w-full flex items-center gap-2 px-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <input
              type="text"
              placeholder='e.g. "Open Chrome, navigate to Flipkart, search for iPhone 18, inspect the search results and close the browser."'
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isSubmitting) handleStart();
              }}
              className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />
          </div>
          <button
            onClick={handleStart}
            disabled={isSubmitting || !userInput.trim()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-cyan-500/20"
          >
            {isSubmitting ? (
              <Clock className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-slate-950" />
            )}
            <span>Execute Instruction</span>
          </button>
        </div>
      </div>

      {/* Main Execution Split View: Plan Steps & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[300px]">
        {/* Left 2 Cols: Step-by-Step AI Execution Plan */}
        <div className="lg:col-span-2 bg-[#0b0f19] border border-slate-800 rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>STRUCTURED EXECUTION PLAN</span>
            </div>
            {currentPlan && (
              <span className="text-[11px] font-mono text-slate-400">
                {currentPlan.steps.length} steps generated
              </span>
            )}
          </div>

          {!currentPlan ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3">
              <Bot className="w-12 h-12 text-slate-700" />
              <div className="text-xs font-medium text-slate-400">No active execution plan</div>
              <p className="text-[11px] text-slate-500 max-w-sm">
                Enter an instruction above or choose a template to watch the AI plan and execute actions.
              </p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {currentPlan.steps.map((step) => (
                <div
                  key={step.id}
                  className={`p-3.5 rounded-lg border transition-all ${
                    step.status === 'RUNNING'
                      ? 'bg-cyan-950/20 border-cyan-500/40 shadow-sm'
                      : step.status === 'SUCCESS'
                      ? 'bg-slate-900/40 border-slate-800'
                      : step.status === 'FAILED'
                      ? 'bg-rose-950/20 border-rose-800/50'
                      : 'bg-[#080c14] border-slate-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getStepIcon(step)}</div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            STEP {step.stepNumber}
                          </span>
                          <span className="text-[10px] font-mono font-semibold text-cyan-400 uppercase">
                            {step.action}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200">{step.description}</p>

                        {/* Params preview */}
                        {step.params && (
                          <div className="flex flex-wrap gap-2 text-[10px] font-mono pt-1">
                            {step.params.url && (
                              <span className="text-sky-300 bg-sky-950/40 px-1.5 py-0.5 rounded border border-sky-800/40 flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {step.params.url}
                              </span>
                            )}
                            {step.params.selector && (
                              <span className="text-amber-300 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40">
                                target: {step.params.selector}
                              </span>
                            )}
                            {step.params.text && (
                              <span className="text-slate-300 bg-slate-800/60 px-1.5 py-0.5 rounded">
                                value: "{step.params.text}"
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-[10px] font-mono text-slate-500 shrink-0">
                      {step.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Goal Details & Live Verification Status */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              Execution Context
            </h2>

            <div className="bg-[#080c14] border border-slate-800/80 rounded-lg p-3 space-y-2 text-xs">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Active Goal</span>
              <p className="text-slate-200 text-xs leading-relaxed italic">
                {currentPlan ? `"${currentPlan.goal}"` : 'No instruction loaded.'}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Status Overview</span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">State</div>
                  <div className="text-cyan-400 font-semibold">{status}</div>
                </div>
                <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Total Steps</div>
                  <div className="text-slate-200 font-semibold">{currentPlan?.steps.length || 0}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-800/30 text-[11px] text-cyan-300/80 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              All steps execute in a visible Playwright browser. You can inspect the real browser window while monitoring live logs below.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
