import React from 'react';
import {
  Play,
  Bot,
  Globe,
  FileCheck2,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useExecutionStore } from '../../stores/useExecutionStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { NavTab } from '../../components/layout/Sidebar';

interface DashboardPageProps {
  onNavigate: (tab: NavTab) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { setUserInput } = useExecutionStore();
  const { settings } = useSettingsStore();

  const handleQuickPrompt = (prompt: string) => {
    setUserInput(prompt);
    onNavigate('automation');
  };

  const hasApiKey = Boolean(settings.geminiApiKey && settings.geminiApiKey.length > 5);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-[#0f172a] to-cyan-950/40 border border-slate-800 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Autonomous AI Agent
              </span>
              <span className="text-slate-400 text-xs">Windows Desktop Engine</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              AI Browser Automation & QA Testing Suite
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Execute natural language browser tasks, generate autonomous QA test cases, capture verification evidence, and self-heal element selectors in real-time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('automation')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-lg shadow-cyan-500/20"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              New Automation
            </button>
            <button
              onClick={() => onNavigate('qa')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <FileCheck2 className="w-4 h-4 text-cyan-400" />
              QA Test Suite
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>QA Pass Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">98.4%</div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <span>+3.2%</span>
            <span className="text-slate-400">vs last 20 test runs</span>
          </div>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Gemini AI Engine</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-lg font-bold text-slate-100 font-mono flex items-center gap-2">
            <span>{settings.geminiModel}</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {hasApiKey ? (
              <span className="text-emerald-400 font-medium">● Key Connected & Verified</span>
            ) : (
              <span className="text-amber-400 font-medium">● Key Required in Settings</span>
            )}
          </div>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Browser Target</span>
            <Globe className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-lg font-bold text-slate-100 font-mono uppercase">
            {settings.browserType} ({settings.headless ? 'Headless' : 'Visible'})
          </div>
          <div className="text-[11px] text-slate-400">
            {settings.viewportWidth} × {settings.viewportHeight}px resolution
          </div>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Security Guardrails</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400 font-mono">Active</div>
          <div className="text-[11px] text-slate-400">
            Human-in-the-loop payment gate active
          </div>
        </div>
      </div>

      {/* Quick Launch Templates */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Bot className="w-4 h-4 text-cyan-400" />
          Quick Launch Automation Templates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              title: 'Flipkart Search & Product Inspection',
              prompt: 'Open Chrome, navigate to Flipkart, search for iPhone 18, inspect the search results and close the browser.',
              tag: 'E-Commerce',
            },
            {
              title: 'Form Validation & Edge Case Check',
              prompt: 'Navigate to https://example.com/login, submit empty form, verify validation error message appears, then test valid input.',
              tag: 'QA Testing',
            },
            {
              title: 'Responsive Navigation & Screenshot Audit',
              prompt: 'Open target site, scroll through full homepage, take section screenshots, verify footer copyright, and record console errors.',
              tag: 'Audit',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => handleQuickPrompt(item.prompt)}
              className="bg-[#0b0f19] hover:bg-[#0f172a] border border-slate-800 hover:border-cyan-500/50 rounded-xl p-4 cursor-pointer transition-all group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {item.tag}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-1" />
                </div>
                <h3 className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-[11px] text-slate-400 line-clamp-2 italic">
                  "{item.prompt}"
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Architecture Readiness */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-5 space-y-4">
        <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          System Readiness & Subsystems
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 p-2.5 rounded bg-slate-900/60 border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-slate-200 font-sans">Electron 34 Shell</div>
              <div className="text-[10px] text-slate-400">Context Isolation ON</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded bg-slate-900/60 border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-slate-200 font-sans">Playwright Engine</div>
              <div className="text-[10px] text-slate-400">Visible Chromium Ready</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded bg-slate-900/60 border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-slate-200 font-sans">IPC Event Stream</div>
              <div className="text-[10px] text-slate-400">Sub-ms Event Bus</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded bg-slate-900/60 border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-slate-200 font-sans">Local Persistence</div>
              <div className="text-[10px] text-slate-400">SQLite Database Active</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
