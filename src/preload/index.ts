import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../common/ipc-channels';
import { AppSettings, ExecutionPlan, LogEntry, PlanStep, QAReport, TestCase, TestSuite } from '../common/types';

const api = {
  // Window controls
  minimize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),
  maximize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MAXIMIZE),
  close: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE),
  isMaximized: (): Promise<boolean> => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_IS_MAXIMIZED),

  // Automation
  startAutomation: (goal: string): Promise<{ success: boolean; plan?: ExecutionPlan; error?: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.START_AUTOMATION, goal),
  pauseAutomation: (): Promise<boolean> => ipcRenderer.invoke(IPC_CHANNELS.PAUSE_AUTOMATION),
  resumeAutomation: (): Promise<boolean> => ipcRenderer.invoke(IPC_CHANNELS.RESUME_AUTOMATION),
  stopAutomation: (): Promise<boolean> => ipcRenderer.invoke(IPC_CHANNELS.STOP_AUTOMATION),
  confirmAction: (confirmed: boolean): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIRM_ACTION, confirmed),

  // Browser
  launchBrowser: (url?: string): Promise<{ success: boolean; url?: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.BROWSER_LAUNCH, url),
  closeBrowser: (): Promise<boolean> => ipcRenderer.invoke(IPC_CHANNELS.BROWSER_CLOSE),
  navigateBrowser: (url: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.BROWSER_NAVIGATE, url),
  takeScreenshot: (): Promise<string | null> => ipcRenderer.invoke(IPC_CHANNELS.BROWSER_SCREENSHOT),
  getBrowserStatus: (): Promise<{ isOpen: boolean; currentUrl?: string; title?: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.BROWSER_STATUS),

  // QA Engine
  generateTests: (instructions: string): Promise<{ success: boolean; suite?: TestSuite; error?: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.GENERATE_TESTS, instructions),
  runTestSuite: (suiteId: string): Promise<{ success: boolean; results?: TestCase[] }> =>
    ipcRenderer.invoke(IPC_CHANNELS.RUN_TEST_SUITE, suiteId),
  getTestSuites: (): Promise<TestSuite[]> => ipcRenderer.invoke(IPC_CHANNELS.GET_TEST_SUITES),

  // Database / History
  getHistory: (): Promise<ExecutionPlan[]> => ipcRenderer.invoke(IPC_CHANNELS.GET_HISTORY),
  getRunDetails: (id: string): Promise<ExecutionPlan | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_RUN_DETAILS, id),
  deleteRun: (id: string): Promise<boolean> => ipcRenderer.invoke(IPC_CHANNELS.DELETE_RUN, id),
  clearHistory: (): Promise<boolean> => ipcRenderer.invoke(IPC_CHANNELS.CLEAR_HISTORY),

  // Reports
  generateReport: (runId: string): Promise<QAReport | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.GENERATE_REPORT, runId),
  exportReportHtml: (reportId: string): Promise<{ success: boolean; filePath?: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.EXPORT_REPORT_HTML, reportId),
  exportReportPdf: (reportId: string): Promise<{ success: boolean; filePath?: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.EXPORT_REPORT_PDF, reportId),

  // Settings
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke(IPC_CHANNELS.GET_SETTINGS),
  saveSettings: (settings: Partial<AppSettings>): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.SAVE_SETTINGS, settings),
  testGeminiKey: (apiKey: string): Promise<{ valid: boolean; error?: string; model?: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.TEST_GEMINI_KEY, apiKey),

  // Real-time Event Streaming Listeners
  onLogEvent: (callback: (log: LogEntry) => void) => {
    const handler = (_: unknown, log: LogEntry) => callback(log);
    ipcRenderer.on(IPC_CHANNELS.LOG_EVENT, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.LOG_EVENT, handler);
  },
  onStepUpdate: (callback: (step: PlanStep) => void) => {
    const handler = (_: unknown, step: PlanStep) => callback(step);
    ipcRenderer.on(IPC_CHANNELS.STEP_UPDATE, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.STEP_UPDATE, handler);
  },
  onExecutionStateUpdate: (callback: (data: { status: string; plan?: ExecutionPlan }) => void) => {
    const handler = (_: unknown, data: { status: string; plan?: ExecutionPlan }) => callback(data);
    ipcRenderer.on(IPC_CHANNELS.EXECUTION_STATE_UPDATE, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.EXECUTION_STATE_UPDATE, handler);
  },
};

export type ElectronAPI = typeof api;

contextBridge.exposeInMainWorld('api', api);
