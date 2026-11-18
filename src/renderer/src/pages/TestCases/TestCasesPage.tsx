import React, { useState } from 'react';
import {
  FileCheck2,
  Sparkles,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  CheckSquare,
  AlertTriangle,
} from 'lucide-react';
import { useQAStore } from '../../stores/useQAStore';
import { useTerminalStore } from '../../stores/useTerminalStore';
import { TestCase, TestStatus } from '../../../../common/types';

export const TestCasesPage: React.FC = () => {
  const {
    activeSuite,
    setActiveSuite,
    filterStatus,
    setFilterStatus,
  } = useQAStore();
  const { addLog } = useTerminalStore();

  const [inputInstructions, setInputInstructions] = useState(
    'Verify e-commerce search, autocomplete dropdown, product card pricing and empty query handling'
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!inputInstructions.trim()) return;
    setIsGenerating(true);

    addLog({
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      level: 'INFO',
      category: 'QA_ENGINE',
      message: `Generating positive, negative, and boundary test scenarios for: "${inputInstructions}"`,
    });

    try {
      const res = await window.api?.generateTests?.(inputInstructions);
      if (res?.success && res.suite) {
        setActiveSuite(res.suite);
        addLog({
          id: (Date.now() + 1).toString(),
          timestamp: new Date().toLocaleTimeString(),
          level: 'SUCCESS',
          category: 'QA_ENGINE',
          message: `Generated ${res.suite.cases.length} autonomous test scenarios.`,
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusBadge = (status: TestStatus) => {
    switch (status) {
      case 'PASS':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> PASS
          </span>
        );
      case 'FAIL':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-950 text-rose-400 border border-rose-800">
            <XCircle className="w-3 h-3" /> FAIL
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-950 text-amber-400 border border-amber-800">
            <AlertTriangle className="w-3 h-3" /> BLOCKED
          </span>
        );
      case 'RUNNING':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800">
            <Clock className="w-3 h-3 animate-spin" /> RUNNING
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
            NOT RUN
          </span>
        );
    }
  };

  const filteredCases = activeSuite?.cases.filter((c) => {
    if (filterStatus === 'ALL') return true;
    return c.status === filterStatus;
  }) || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-cyan-400" />
            Autonomous QA Testing Engine
          </h1>
          <p className="text-xs text-slate-400">
            Synthesize positive, negative, and boundary test cases, execute automated assertions, and capture evidence.
          </p>
        </div>

        {activeSuite && (
          <button
            onClick={() => {
              addLog({
                id: Date.now().toString(),
                timestamp: new Date().toLocaleTimeString(),
                level: 'ACTION',
                category: 'QA_ENGINE',
                message: `Executing test suite: ${activeSuite.name}`,
              });
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-md shadow-emerald-500/20"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            Execute Test Suite
          </button>
        )}
      </div>

      {/* Test Generation Input */}
      <div className="bg-[#0b0f19] border border-slate-800 p-3 rounded-xl space-y-3 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Generate Comprehensive Test Cases via AI</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={inputInstructions}
            onChange={(e) => setInputInstructions(e.target.value)}
            placeholder="Describe features or user flows to test..."
            className="flex-1 bg-[#060911] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !inputInstructions.trim()}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 disabled:opacity-50 transition-colors"
          >
            {isGenerating ? <Clock className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Tests
          </button>
        </div>
      </div>

      {/* Test Case Suite Grid */}
      <div className="flex-1 flex flex-col space-y-4">
        {/* Filters and Stats */}
        {activeSuite && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0b0f19] border border-slate-800/80 p-3 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">{activeSuite.name}</span>
              <span className="text-slate-500 font-mono text-[10px]">({activeSuite.cases.length} cases)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
              {(['ALL', 'PASS', 'FAIL', 'BLOCKED', 'NOT_RUN'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    filterStatus === st
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Test Case Cards */}
        <div className="space-y-3 overflow-y-auto flex-1">
          {!activeSuite ? (
            <div className="text-center p-12 bg-[#0b0f19] border border-slate-800 rounded-xl space-y-3">
              <CheckSquare className="w-12 h-12 text-slate-700 mx-auto" />
              <div className="text-xs font-medium text-slate-400">No QA Test Suite active</div>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Generate test cases using the bar above to evaluate positive, negative, and boundary scenarios.
              </p>
            </div>
          ) : (
            filteredCases.map((tc: TestCase) => (
              <div
                key={tc.id}
                className="bg-[#0b0f19] border border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {tc.id}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                          tc.scenarioType === 'POSITIVE'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                            : tc.scenarioType === 'NEGATIVE'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800/40'
                            : 'bg-amber-950 text-amber-400 border border-amber-800/40'
                        }`}
                      >
                        {tc.scenarioType}
                      </span>
                      <h3 className="text-xs font-semibold text-slate-200">{tc.title}</h3>
                    </div>
                    <p className="text-[11px] text-slate-400">{tc.description}</p>
                  </div>
                  {getStatusBadge(tc.status)}
                </div>

                {/* Preconditions, Steps, and Expected Output */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-[#070a12] p-3 rounded-lg border border-slate-800/80 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Execution Steps</span>
                    <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
                      {tc.steps.map((st, i) => (
                        <li key={i}>{st}</li>
                      ))}
                    </ol>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Expected Result</span>
                    <p className="text-emerald-400/90 text-[11px] font-sans leading-relaxed">
                      {tc.expectedResult}
                    </p>
                    {tc.actualResult && (
                      <div className="mt-2 pt-2 border-t border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase block mb-1">Actual Result</span>
                        <p className="text-slate-300 text-[11px] font-sans">{tc.actualResult}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
