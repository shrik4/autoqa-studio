import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { IPC_CHANNELS } from '../common/ipc-channels';
import { AppSettings, ExecutionPlan, LogEntry, PlanStep, QAReport, TestCase, TestSuite } from '../common/types';
import { BrowserManager } from './automation/browser-manager';
import { ActionExecutor } from './automation/action-executor';
import { DomInspector } from './automation/dom-inspector';
import { DatabaseService } from './database/db-service';
import { GeminiService } from './ai/gemini-client';
import { QAEngine } from './qa/qa-engine';
import { ReportGenerator } from './reports/report-generator';

let mainWindow: BrowserWindow | null = null;
const browserManager = BrowserManager.getInstance();
const dbService = DatabaseService.getInstance();
let actionExecutor: ActionExecutor | null = null;
let qaEngine: QAEngine | null = null;
let reportGenerator: ReportGenerator | null = null;

let activeExecutionPlan: ExecutionPlan | null = null;
let activeTestSuite: TestSuite | null = null;
let isExecutionPaused = false;
let isExecutionCancelled = false;

// Default Application Settings
const defaultSettings: AppSettings = {
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash',
  browserType: 'chrome',
  headless: false,
  viewportWidth: 1280,
  viewportHeight: 800,
  actionTimeoutMs: 15000,
  slowMoMs: 400,
  maxRetries: 2,
  requireConfirmationForSensitive: true,
  saveScreenshotsOnFailure: true,
  theme: 'dark',
};

function getSettingsFilePath(): string {
  return path.join(app.getPath('userData'), 'autoqa-settings.json');
}

function loadSettings(): AppSettings {
  try {
    const filePath = getSettingsFilePath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return { ...defaultSettings, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
  return defaultSettings;
}

function saveSettings(settings: Partial<AppSettings>): boolean {
  try {
    const current = loadSettings();
    const updated = { ...current, ...settings };
    const filePath = getSettingsFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to save settings:', err);
    return false;
  }
}

function broadcastLog(log: LogEntry): void {
  mainWindow?.webContents.send(IPC_CHANNELS.LOG_EVENT, log);
  dbService.saveLog(log, activeExecutionPlan?.id);
}

function broadcastStepUpdate(step: PlanStep): void {
  mainWindow?.webContents.send(IPC_CHANNELS.STEP_UPDATE, step);
}

function broadcastStateUpdate(status: string, plan?: ExecutionPlan): void {
  mainWindow?.webContents.send(IPC_CHANNELS.EXECUTION_STATE_UPDATE, { status, plan });
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#090d16',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    // 1. Initialize SQLite Database
    await dbService.init();

    // 2. Setup Subsystems
    browserManager.setLogBroadcaster(broadcastLog);
    actionExecutor = new ActionExecutor(broadcastLog);
    qaEngine = new QAEngine(browserManager, actionExecutor, dbService, broadcastLog);
    reportGenerator = new ReportGenerator(dbService);

    // 3. Register IPC & Window
    registerIpcHandlers();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('window-all-closed', async () => {
  await browserManager.close();
  dbService.persist();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function registerIpcHandlers(): void {
  // Window controls
  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
    mainWindow?.minimize();
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => {
    mainWindow?.close();
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_IS_MAXIMIZED, () => {
    return mainWindow?.isMaximized() ?? false;
  });

  // Settings
  ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, () => {
    return loadSettings();
  });

  ipcMain.handle(IPC_CHANNELS.SAVE_SETTINGS, (_event, settings: Partial<AppSettings>) => {
    return saveSettings(settings);
  });

  ipcMain.handle(IPC_CHANNELS.TEST_GEMINI_KEY, async (_event, apiKey: string) => {
    if (!apiKey || apiKey.trim().length < 10) {
      return { valid: false, error: 'API key is too short or empty.' };
    }
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return { 
          valid: false, 
          error: (errorData as { error?: { message?: string } })?.error?.message || `HTTP ${res.status}: Verification failed` 
        };
      }
      return { valid: true, model: 'gemini-2.5-flash' };
    } catch (err: unknown) {
      return { valid: false, error: err instanceof Error ? err.message : 'Network error testing Gemini key' };
    }
  });

  // Browser Controls (Playwright)
  ipcMain.handle(IPC_CHANNELS.BROWSER_LAUNCH, async (_event, url?: string) => {
    const settings = loadSettings();
    return await browserManager.launch(settings, url);
  });

  ipcMain.handle(IPC_CHANNELS.BROWSER_CLOSE, async () => {
    return await browserManager.close();
  });

  ipcMain.handle(IPC_CHANNELS.BROWSER_NAVIGATE, async (_event, url: string) => {
    const settings = loadSettings();
    if (!browserManager.getPage()) {
      await browserManager.launch(settings, url);
      return true;
    }
    return await browserManager.navigate(url, settings.actionTimeoutMs);
  });

  ipcMain.handle(IPC_CHANNELS.BROWSER_SCREENSHOT, async () => {
    return await browserManager.takeScreenshot();
  });

  ipcMain.handle(IPC_CHANNELS.BROWSER_STATUS, async () => {
    return await browserManager.getStatus();
  });

  // AI-Powered Automation Execution Runner
  ipcMain.handle(IPC_CHANNELS.START_AUTOMATION, async (_event, goal: string) => {
    isExecutionPaused = false;
    isExecutionCancelled = false;

    broadcastLog({
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      level: 'INFO',
      category: 'AI_PLANNER',
      message: `Analyzing instruction: "${goal}"`,
    });

    const settings = loadSettings();
    let planSteps: PlanStep[] = [];

    // 1. Try Gemini AI decomposition if API key is provided
    if (settings.geminiApiKey && settings.geminiApiKey.length > 10) {
      try {
        broadcastLog({
          id: (Date.now() + 1).toString(),
          timestamp: new Date().toLocaleTimeString(),
          level: 'INFO',
          category: 'AI_PLANNER',
          message: `Querying Gemini AI (${settings.geminiModel}) for structured step decomposition...`,
        });
        const gemini = new GeminiService(settings.geminiApiKey, settings.geminiModel);
        const status = await browserManager.getStatus();
        planSteps = await gemini.planExecution(goal, status.currentUrl);
      } catch (geminiErr: unknown) {
        broadcastLog({
          id: (Date.now() + 2).toString(),
          timestamp: new Date().toLocaleTimeString(),
          level: 'WARN',
          category: 'AI_PLANNER',
          message: `Gemini planning fallback to rule-based engine: ${(geminiErr as Error).message}`,
        });
        planSteps = buildFallbackPlan(goal);
      }
    } else {
      broadcastLog({
        id: (Date.now() + 3).toString(),
        timestamp: new Date().toLocaleTimeString(),
        level: 'INFO',
        category: 'AI_PLANNER',
        message: 'No Gemini API key configured. Using intelligent rule-based step generator.',
      });
      planSteps = buildFallbackPlan(goal);
    }

    const plan: ExecutionPlan = {
      id: `run-${Date.now()}`,
      goal,
      createdAt: new Date().toISOString(),
      status: 'EXECUTING',
      currentStepIndex: 0,
      steps: planSteps,
    };

    activeExecutionPlan = plan;
    dbService.saveRun(plan);

    // Launch execution loop asynchronously
    setTimeout(() => {
      runExecutionPipeline(plan, settings);
    }, 100);

    return { success: true, plan };
  });

  ipcMain.handle(IPC_CHANNELS.PAUSE_AUTOMATION, async () => {
    isExecutionPaused = true;
    broadcastLog({
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      level: 'WARN',
      category: 'SYSTEM',
      message: 'Execution paused by user.',
    });
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.RESUME_AUTOMATION, async () => {
    isExecutionPaused = false;
    broadcastLog({
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      level: 'INFO',
      category: 'SYSTEM',
      message: 'Execution resumed by user.',
    });
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.STOP_AUTOMATION, async () => {
    isExecutionCancelled = true;
    broadcastLog({
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      level: 'WARN',
      category: 'SYSTEM',
      message: 'Execution stopped by user.',
    });
    return true;
  });

  // QA Generation & Execution
  ipcMain.handle(IPC_CHANNELS.GENERATE_TESTS, async (_event, instructions: string) => {
    const settings = loadSettings();
    let suite: TestSuite;

    if (settings.geminiApiKey && settings.geminiApiKey.length > 10) {
      try {
        const gemini = new GeminiService(settings.geminiApiKey, settings.geminiModel);
        suite = await gemini.generateQASuite(instructions, 'https://www.flipkart.com');
      } catch (err) {
        broadcastLog({
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString(),
          level: 'WARN',
          category: 'QA_ENGINE',
          message: `AI QA generation fallback: ${(err as Error).message}`,
        });
        suite = buildFallbackQASuite(instructions);
      }
    } else {
      suite = buildFallbackQASuite(instructions);
    }

    activeTestSuite = suite;
    dbService.saveTestSuite(suite);
    return { success: true, suite };
  });

  ipcMain.handle(IPC_CHANNELS.RUN_TEST_SUITE, async (_event, suiteId: string) => {
    const settings = loadSettings();
    const suites = dbService.getTestSuites();
    const suite = suites.find((s) => s.id === suiteId) || activeTestSuite;
    if (!suite || !qaEngine) {
      return { success: false };
    }

    const completedSuite = await qaEngine.runSuite(suite, settings, (tc) => {
      // Stream update to renderer
      mainWindow?.webContents.send(IPC_CHANNELS.STEP_UPDATE, tc);
    });

    // Compile report
    if (activeExecutionPlan && reportGenerator) {
      reportGenerator.compileReport(activeExecutionPlan, completedSuite);
    }

    return { success: true, results: completedSuite.cases };
  });

  ipcMain.handle(IPC_CHANNELS.GET_TEST_SUITES, async () => {
    return dbService.getTestSuites();
  });

  // History & Database
  ipcMain.handle(IPC_CHANNELS.GET_HISTORY, async () => {
    return dbService.getRuns();
  });

  ipcMain.handle(IPC_CHANNELS.GET_RUN_DETAILS, async (_event, id: string) => {
    const runs = dbService.getRuns();
    return runs.find((r) => r.id === id) || null;
  });

  ipcMain.handle(IPC_CHANNELS.DELETE_RUN, async (_event, id: string) => {
    return dbService.deleteRun(id);
  });

  ipcMain.handle(IPC_CHANNELS.CLEAR_HISTORY, async () => {
    return dbService.clearAllRuns();
  });

  // Reports
  ipcMain.handle(IPC_CHANNELS.GENERATE_REPORT, async (_event, runId: string) => {
    const runs = dbService.getRuns();
    const plan = runs.find((r) => r.id === runId) || activeExecutionPlan;
    if (!plan || !reportGenerator) return null;
    return reportGenerator.compileReport(plan, activeTestSuite || undefined);
  });

  ipcMain.handle(IPC_CHANNELS.EXPORT_REPORT_HTML, async (_event, reportId: string) => {
    if (!reportGenerator) return { success: false };
    const res = await reportGenerator.exportHtml(reportId);
    if (res.success && res.filePath) {
      shell.showItemInFolder(res.filePath);
    }
    return res;
  });

  ipcMain.handle(IPC_CHANNELS.EXPORT_REPORT_PDF, async (_event, reportId: string) => {
    if (!reportGenerator) return { success: false };
    const res = await reportGenerator.exportPdf(reportId);
    if (res.success && res.filePath) {
      shell.showItemInFolder(res.filePath);
    }
    return res;
  });
}

/**
 * Intelligent Rule-based plan fallback when Gemini API key is not configured
 */
function buildFallbackPlan(instruction: string): PlanStep[] {
  const lower = instruction.toLowerCase();

  if (lower.includes('flipkart') || lower.includes('iphone')) {
    return [
      {
        id: 'step-1',
        stepNumber: 1,
        description: 'Launch visible Chromium browser and navigate to Flipkart',
        action: 'NAVIGATE',
        params: { url: 'https://www.flipkart.com' },
        status: 'PENDING',
      },
      {
        id: 'step-2',
        stepNumber: 2,
        description: 'Locate search box and type "iPhone 18"',
        action: 'TYPE',
        params: { selector: 'input[name="q"], input[placeholder*="Search"]', text: 'iPhone 18' },
        status: 'PENDING',
      },
      {
        id: 'step-3',
        stepNumber: 3,
        description: 'Press Enter to submit search query',
        action: 'PRESS_KEY',
        params: { key: 'Enter' },
        status: 'PENDING',
      },
      {
        id: 'step-4',
        stepNumber: 4,
        description: 'Scroll through search results page to inspect items',
        action: 'SCROLL',
        params: { direction: 'down', amount: 600 },
        status: 'PENDING',
      },
      {
        id: 'step-5',
        stepNumber: 5,
        description: 'Capture screenshot of search results',
        action: 'SCREENSHOT',
        params: {},
        status: 'PENDING',
      },
      {
        id: 'step-6',
        stepNumber: 6,
        description: 'Read visible page content to verify results',
        action: 'READ_PAGE_CONTENT',
        params: {},
        status: 'PENDING',
      },
      {
        id: 'step-7',
        stepNumber: 7,
        description: 'Close browser session as requested',
        action: 'CLOSE_BROWSER',
        params: {},
        status: 'PENDING',
      },
    ];
  }

  const urlMatch = instruction.match(/https?:\/\/[^\s]+/);
  const targetUrl = urlMatch ? urlMatch[0] : 'https://www.google.com';

  return [
    {
      id: 'step-1',
      stepNumber: 1,
      description: `Launch visible browser and navigate to ${targetUrl}`,
      action: 'NAVIGATE',
      params: { url: targetUrl },
      status: 'PENDING',
    },
    {
      id: 'step-2',
      stepNumber: 2,
      description: 'Scroll down to inspect page layout',
      action: 'SCROLL',
      params: { direction: 'down', amount: 500 },
      status: 'PENDING',
    },
    {
      id: 'step-3',
      stepNumber: 3,
      description: 'Capture viewport screenshot',
      action: 'SCREENSHOT',
      params: {},
      status: 'PENDING',
    },
    {
      id: 'step-4',
      stepNumber: 4,
      description: 'Read and verify page content',
      action: 'READ_PAGE_CONTENT',
      params: {},
      status: 'PENDING',
    },
  ];
}

function buildFallbackQASuite(instructions: string): TestSuite {
  return {
    id: `suite-${Date.now()}`,
    name: `Autonomous Test Suite: ${instructions.slice(0, 45)}...`,
    targetUrl: 'https://www.flipkart.com',
    createdAt: new Date().toISOString(),
    status: 'PENDING',
    summary: { total: 4, passed: 0, failed: 0, blocked: 0 },
    cases: [
      {
        id: 'tc-1',
        title: 'Verify Search Bar Input & Autocomplete Suggestions',
        description: 'Ensure typing the query updates the input and triggers suggestion results.',
        scenarioType: 'POSITIVE',
        preconditions: ['Browser active', 'Target landing page loaded'],
        steps: ['Locate search input field', 'Type "iPhone 18"', 'Verify suggestion dropdown renders'],
        expectedResult: 'Search input contains text and suggestions dropdown is displayed.',
        status: 'NOT_RUN',
      },
      {
        id: 'tc-2',
        title: 'Verify Enter Key Triggers Search Results Navigation',
        description: 'Submitting query via Enter key should route directly to the results view.',
        scenarioType: 'POSITIVE',
        preconditions: ['Query string populated in search bar'],
        steps: ['Press "Enter" keyboard key', 'Wait for navigation to complete', 'Inspect product cards'],
        expectedResult: 'Product grid renders with multiple items and status 200.',
        status: 'NOT_RUN',
      },
      {
        id: 'tc-3',
        title: 'Empty Query Form Submission Resilience',
        description: 'Submitting an empty search query should not trigger an uncaught application error.',
        scenarioType: 'NEGATIVE',
        preconditions: ['Search input field empty'],
        steps: ['Clear search input', 'Press Enter or submit', 'Assert URL & error handling'],
        expectedResult: 'Application prevents invalid submission without crashing.',
        status: 'NOT_RUN',
      },
      {
        id: 'tc-4',
        title: 'Verify Product Card Pricing and Currency Formatting',
        description: 'Ensure all returned product cards display valid non-empty pricing elements.',
        scenarioType: 'BOUNDARY',
        preconditions: ['Search results visible on screen'],
        steps: ['Inspect first 4 search result elements', 'Assert existence of price label', 'Assert title link'],
        expectedResult: 'All target cards render valid pricing and title hyperlinks.',
        status: 'NOT_RUN',
      },
    ],
  };
}

/**
 * Sequential execution pipeline orchestrating real Playwright actions with self-healing AI
 */
async function runExecutionPipeline(plan: ExecutionPlan, settings: AppSettings): Promise<void> {
  const startTime = Date.now();
  broadcastLog({
    id: Date.now().toString(),
    timestamp: new Date().toLocaleTimeString(),
    level: 'INFO',
    category: 'SYSTEM',
    message: `Executing ${plan.steps.length} steps in visible browser...`,
  });

  if (!actionExecutor) {
    actionExecutor = new ActionExecutor(broadcastLog);
  }

  const gemini = settings.geminiApiKey ? new GeminiService(settings.geminiApiKey, settings.geminiModel) : null;

  for (let i = 0; i < plan.steps.length; i++) {
    if (isExecutionCancelled) {
      plan.status = 'CANCELLED';
      broadcastStateUpdate('CANCELLED', plan);
      break;
    }

    while (isExecutionPaused && !isExecutionCancelled) {
      await new Promise((r) => setTimeout(r, 500));
    }

    const step = plan.steps[i];
    step.status = 'RUNNING';
    plan.currentStepIndex = i;
    broadcastStepUpdate(step);
    broadcastStateUpdate('EXECUTING', plan);

    try {
      if (step.action === 'CLOSE_BROWSER') {
        await browserManager.close();
        step.status = 'SUCCESS';
        broadcastStepUpdate(step);
        continue;
      }

      if (!browserManager.getPage()) {
        const initialUrl = step.action === 'NAVIGATE' ? step.params.url : undefined;
        const launchResult = await browserManager.launch(settings, initialUrl);
        if (!launchResult.success) {
          throw new Error(`Failed to launch browser: ${launchResult.error}`);
        }
        if (step.action === 'NAVIGATE') {
          step.status = 'SUCCESS';
          broadcastStepUpdate(step);
          continue;
        }
      }

      const page = browserManager.getPage();
      if (!page) throw new Error('Browser page is null.');

      const result = await actionExecutor.executeStep(page, step, settings.actionTimeoutMs);

      if (result.success) {
        step.status = 'SUCCESS';
        if (result.screenshot) step.screenshot = result.screenshot;
      } else {
        step.status = 'FAILED';
        step.error = result.error;
        if (result.screenshot) step.screenshot = result.screenshot;

        // Self-Healing with AI
        if (gemini && page && !page.isClosed()) {
          try {
            const domSummary = await DomInspector.getPageTextSummary(page);
            broadcastLog({
              id: Date.now().toString(),
              timestamp: new Date().toLocaleTimeString(),
              level: 'INFO',
              category: 'AI_PLANNER',
              message: `Analyzing failure for Step ${step.stepNumber} with Gemini AI...`,
            });
            const diagnosis = await gemini.diagnoseFailure(plan.goal, step, result.error || '', domSummary);
            broadcastLog({
              id: (Date.now() + 1).toString(),
              timestamp: new Date().toLocaleTimeString(),
              level: diagnosis.isWebsiteBug ? 'WARN' : 'INFO',
              category: 'AI_PLANNER',
              message: `[AI Diagnosis] ${diagnosis.rootCause}. Suggestion: ${diagnosis.suggestion}`,
            });

            if (diagnosis.canRetry && diagnosis.healedSelector) {
              step.params.selector = diagnosis.healedSelector;
              broadcastLog({
                id: (Date.now() + 2).toString(),
                timestamp: new Date().toLocaleTimeString(),
                level: 'SUCCESS',
                category: 'RETRY',
                message: `Applying healed selector: "${diagnosis.healedSelector}"`,
              });
            }
          } catch (diagErr) {
            console.error('Error during AI diagnosis:', diagErr);
          }
        }

        // Retry check
        if ((step.retryCount || 0) < settings.maxRetries) {
          step.retryCount = (step.retryCount || 0) + 1;
          step.status = 'RETRYING';
          broadcastStepUpdate(step);
          broadcastLog({
            id: Date.now().toString(),
            timestamp: new Date().toLocaleTimeString(),
            level: 'WARN',
            category: 'RETRY',
            message: `Retrying Step ${step.stepNumber} (Attempt ${step.retryCount}/${settings.maxRetries})...`,
          });
          i--;
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
      }
    } catch (err: unknown) {
      step.status = 'FAILED';
      step.error = err instanceof Error ? err.message : String(err);
    }

    broadcastStepUpdate(step);

    if (settings.slowMoMs) {
      await new Promise((r) => setTimeout(r, settings.slowMoMs));
    }
  }

  const hasFailed = plan.steps.some((s) => s.status === 'FAILED');
  plan.status = isExecutionCancelled ? 'CANCELLED' : hasFailed ? 'FAILED' : 'COMPLETED';
  plan.stats = {
    totalSteps: plan.steps.length,
    completedSteps: plan.steps.filter((s) => s.status === 'SUCCESS').length,
    failedSteps: plan.steps.filter((s) => s.status === 'FAILED').length,
    retries: plan.steps.reduce((acc, s) => acc + (s.retryCount || 0), 0),
    durationMs: Date.now() - startTime,
  };

  dbService.saveRun(plan);
  broadcastStateUpdate(plan.status, plan);

  // Automatically generate report in background
  if (reportGenerator) {
    reportGenerator.compileReport(plan, activeTestSuite || undefined);
  }

  broadcastLog({
    id: Date.now().toString(),
    timestamp: new Date().toLocaleTimeString(),
    level: plan.status === 'COMPLETED' ? 'SUCCESS' : 'ERROR',
    category: 'SYSTEM',
    message: `Execution ${plan.status} in ${(plan.stats.durationMs / 1000).toFixed(1)}s. Completed: ${plan.stats.completedSteps}/${plan.steps.length} steps.`,
  });
}
