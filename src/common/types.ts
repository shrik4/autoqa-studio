export type ExecutionStatus = 'IDLE' | 'PLANNING' | 'EXECUTING' | 'PAUSED' | 'VERIFYING' | 'RETRYING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type LogLevel = 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'ACTION';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: 'AI_PLANNER' | 'BROWSER' | 'PLAYWRIGHT' | 'QA_ENGINE' | 'SYSTEM' | 'RETRY';
  message: string;
  metadata?: Record<string, unknown>;
  screenshotUrl?: string;
}

export type ActionType = 
  | 'NAVIGATE'
  | 'CLICK'
  | 'TYPE'
  | 'PRESS_KEY'
  | 'SCROLL'
  | 'HOVER'
  | 'SELECT_OPTION'
  | 'SCREENSHOT'
  | 'WAIT_FOR_ELEMENT'
  | 'ASSERT_TEXT'
  | 'ASSERT_VISIBLE'
  | 'READ_PAGE_CONTENT'
  | 'CLOSE_BROWSER';

export interface PlanStep {
  id: string;
  stepNumber: number;
  description: string;
  action: ActionType;
  params: {
    url?: string;
    selector?: string;
    text?: string;
    key?: string;
    direction?: 'up' | 'down';
    amount?: number;
    value?: string;
    expectedText?: string;
    timeout?: number;
    requiresConfirmation?: boolean;
  };
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'RETRYING';
  durationMs?: number;
  error?: string;
  screenshot?: string;
  retryCount?: number;
}

export interface ExecutionPlan {
  id: string;
  goal: string;
  createdAt: string;
  steps: PlanStep[];
  currentStepIndex: number;
  status: ExecutionStatus;
  summary?: string;
  stats?: {
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    retries: number;
    durationMs: number;
  };
}

export type TestScenarioType = 'POSITIVE' | 'NEGATIVE' | 'BOUNDARY' | 'SECURITY';
export type TestStatus = 'NOT_RUN' | 'RUNNING' | 'PASS' | 'FAIL' | 'BLOCKED';

export interface TestCase {
  id: string;
  title: string;
  description: string;
  scenarioType: TestScenarioType;
  preconditions: string[];
  steps: string[];
  expectedResult: string;
  actualResult?: string;
  status: TestStatus;
  durationMs?: number;
  errorTrace?: string;
  evidenceScreenshot?: string;
}

export interface TestSuite {
  id: string;
  name: string;
  targetUrl: string;
  cases: TestCase[];
  createdAt: string;
  completedAt?: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  summary?: {
    total: number;
    passed: number;
    failed: number;
    blocked: number;
  };
}

export interface QAReport {
  id: string;
  runId: string;
  title: string;
  targetUrl: string;
  timestamp: string;
  durationMs: number;
  totalSteps: number;
  successfulSteps: number;
  failedSteps: number;
  testCases: TestCase[];
  passedCount: number;
  failedCount: number;
  blockedCount: number;
  screenshots: string[];
  errorDescriptions: string[];
  aiAnalysis: string;
  aiSuggestions: string[];
}

export interface AppSettings {
  geminiApiKey: string;
  geminiModel: string;
  browserType: 'chromium' | 'chrome';
  headless: boolean;
  viewportWidth: number;
  viewportHeight: number;
  actionTimeoutMs: number;
  slowMoMs: number;
  maxRetries: number;
  requireConfirmationForSensitive: boolean;
  saveScreenshotsOnFailure: boolean;
  theme: 'dark';
}
