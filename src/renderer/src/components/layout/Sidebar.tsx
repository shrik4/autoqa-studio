import React from 'react';
import {
  LayoutDashboard,
  Bot,
  Globe,
  FileCheck2,
  History,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Terminal,
  KeyRound,
} from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTerminalStore } from '../../stores/useTerminalStore';

export type NavTab = 'dashboard' | 'automation' | 'browser' | 'qa' | 'history' | 'reports' | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { settings } = useSettingsStore();
  const { isDockOpen, toggleDock, logs } = useTerminalStore();

  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'automation', label: 'AI Automation', icon: Bot },
    { id: 'browser', label: 'Browser View', icon: Globe },
    { id: 'qa', label: 'QA Engine', icon: FileCheck2 },
    { id: 'history', label: 'History', icon: History },
    { id: 'reports', label: 'QA Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const hasApiKey = Boolean(settings.geminiApiKey && settings.geminiApiKey.length > 5);

  return (
    <aside
      className={`relative flex flex-col bg-[#0b0f19] border-r border-slate-800/80 transition-all duration-300 select-none z-40 ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Navigation Links */}
      <div className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {!isCollapsed && item.id === 'automation' && (
                <span className="ml-auto text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                  AGENT
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Terminal Dock Quick Toggle & System Status Badge */}
      <div className="p-2 border-t border-slate-800/60 space-y-2">
        <button
          onClick={toggleDock}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
            isDockOpen
              ? 'bg-slate-800/70 border-slate-700 text-cyan-400'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle Terminal Dock"
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            {!isCollapsed && <span>Live Terminal</span>}
          </div>
          {!isCollapsed && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {logs.length}
            </span>
          )}
        </button>

        {/* API Key Status Alert */}
        {!isCollapsed && (
          <div
            onClick={() => onTabChange('settings')}
            className={`cursor-pointer px-3 py-2 rounded-lg border text-[11px] flex items-center gap-2 transition-colors ${
              hasApiKey
                ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400'
                : 'bg-amber-950/30 border-amber-900/50 text-amber-400 hover:bg-amber-950/50'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate font-mono">
              {hasApiKey ? 'Gemini API Ready' : 'Configure Gemini Key'}
            </span>
          </div>
        )}

        {/* Collapse Sidebar Button */}
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
