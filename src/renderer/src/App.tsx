import React, { useState, useEffect } from 'react';
import { TitleBar } from './components/layout/TitleBar';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { LiveTerminal } from './components/terminal/LiveTerminal';
import { ConfirmationModal } from './components/modals/ConfirmationModal';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { AutomationPage } from './pages/Automation/AutomationPage';
import { BrowserPage } from './pages/Browser/BrowserPage';
import { TestCasesPage } from './pages/TestCases/TestCasesPage';
import { HistoryPage } from './pages/History/HistoryPage';
import { ReportsPage } from './pages/Reports/ReportsPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { useTerminalStore } from './stores/useTerminalStore';
import { useExecutionStore } from './stores/useExecutionStore';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const { addLog } = useTerminalStore();
  const { updateStep, setStatus, setPlan } = useExecutionStore();

  useEffect(() => {
    // Listen for live event streaming from Electron Main Process
    let unsubscribeLog: (() => void) | undefined;
    let unsubscribeStep: (() => void) | undefined;
    let unsubscribeState: (() => void) | undefined;

    if (window.api) {
      if (window.api.onLogEvent) {
        unsubscribeLog = window.api.onLogEvent((log) => {
          addLog(log);
        });
      }

      if (window.api.onStepUpdate) {
        unsubscribeStep = window.api.onStepUpdate((step) => {
          updateStep(step);
        });
      }

      if (window.api.onExecutionStateUpdate) {
        unsubscribeState = window.api.onExecutionStateUpdate((data) => {
          if (data.status) setStatus(data.status as any);
          if (data.plan) setPlan(data.plan);
        });
      }
    }

    return () => {
      unsubscribeLog?.();
      unsubscribeStep?.();
      unsubscribeState?.();
    };
  }, [addLog, updateStep, setStatus, setPlan]);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={setActiveTab} />;
      case 'automation':
        return <AutomationPage />;
      case 'browser':
        return <BrowserPage />;
      case 'qa':
        return <TestCasesPage />;
      case 'history':
        return <HistoryPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090d16] text-slate-100 overflow-hidden font-sans select-none">
      {/* 1. Custom Frameless Titlebar */}
      <TitleBar />

      {/* 2. Middle Region: Sidebar + Main Workspace View */}
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        <main className="flex-1 overflow-hidden relative bg-[#090d16]">
          {renderActivePage()}
        </main>
      </div>

      {/* 3. Bottom Dock: Real-Time Event Streaming Live Terminal */}
      <LiveTerminal />

      {/* 4. Sensitive Action Safety Confirmation Modal */}
      <ConfirmationModal />
    </div>
  );
};

export default App;
