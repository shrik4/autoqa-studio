export const IPC_CHANNELS = {
  // Window controls
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_IS_MAXIMIZED: 'window:is-maximized',

  // Automation
  START_AUTOMATION: 'automation:start',
  PAUSE_AUTOMATION: 'automation:pause',
  RESUME_AUTOMATION: 'automation:resume',
  STOP_AUTOMATION: 'automation:stop',
  CONFIRM_ACTION: 'automation:confirm-action',

  // Browser
  BROWSER_LAUNCH: 'browser:launch',
  BROWSER_CLOSE: 'browser:close',
  BROWSER_NAVIGATE: 'browser:navigate',
  BROWSER_SCREENSHOT: 'browser:screenshot',
  BROWSER_STATUS: 'browser:status',

  // Real-time Event Streaming
  LOG_EVENT: 'stream:log-event',
  STEP_UPDATE: 'stream:step-update',
  EXECUTION_STATE_UPDATE: 'stream:state-update',

  // QA Engine
  GENERATE_TESTS: 'qa:generate-tests',
  RUN_TEST_SUITE: 'qa:run-suite',
  GET_TEST_SUITES: 'qa:get-suites',

  // History & Database
  GET_HISTORY: 'db:get-history',
  GET_RUN_DETAILS: 'db:get-run-details',
  DELETE_RUN: 'db:delete-run',
  CLEAR_HISTORY: 'db:clear-history',

  // Reports
  GENERATE_REPORT: 'reports:generate',
  EXPORT_REPORT_HTML: 'reports:export-html',
  EXPORT_REPORT_PDF: 'reports:export-pdf',

  // Settings
  GET_SETTINGS: 'settings:get',
  SAVE_SETTINGS: 'settings:save',
  TEST_GEMINI_KEY: 'settings:test-key',
} as const;

export type IpcChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
