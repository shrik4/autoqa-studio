import { chromium, Browser, BrowserContext, Page } from 'playwright-core';
import { AppSettings, LogEntry } from '../../common/types';

export type LogBroadcaster = (log: LogEntry) => void;

export class BrowserManager {
  private static instance: BrowserManager;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private broadcastLog: LogBroadcaster | null = null;

  private constructor() {}

  public static getInstance(): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager();
    }
    return BrowserManager.instance;
  }

  public setLogBroadcaster(broadcaster: LogBroadcaster): void {
    this.broadcastLog = broadcaster;
  }

  private log(
    level: LogEntry['level'],
    category: LogEntry['category'],
    message: string,
    metadata?: Record<string, unknown>,
    screenshotUrl?: string
  ): void {
    if (this.broadcastLog) {
      this.broadcastLog({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toLocaleTimeString(),
        level,
        category,
        message,
        metadata,
        screenshotUrl,
      });
    }
  }

  public async launch(settings: AppSettings, initialUrl?: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      if (this.browser && this.page) {
        if (initialUrl) {
          await this.navigate(initialUrl, settings.actionTimeoutMs);
        }
        return { success: true, url: this.page.url() };
      }

      this.log('INFO', 'BROWSER', `Launching visible ${settings.browserType} browser...`);

      // Determine channel: 'chrome' or 'msedge'
      let channel: string | undefined = 'chrome';
      if (settings.browserType === 'chrome') {
        channel = 'chrome';
      }

      try {
        this.browser = await chromium.launch({
          channel,
          headless: settings.headless,
          slowMo: settings.slowMoMs || 300,
          args: [
            '--start-maximized',
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
          ],
        });
      } catch (chromeErr) {
        // Fallback to msedge if Chrome is unavailable
        this.log('WARN', 'BROWSER', `Chrome launch fallback to Edge: ${(chromeErr as Error).message}`);
        this.browser = await chromium.launch({
          channel: 'msedge',
          headless: settings.headless,
          slowMo: settings.slowMoMs || 300,
        });
      }

      this.context = await this.browser.newContext({
        viewport: settings.headless
          ? { width: settings.viewportWidth, height: settings.viewportHeight }
          : null, // null viewport allows real OS window maximizing
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      });

      this.page = await this.context.newPage();

      // Setup browser telemetry listeners
      this.setupPageListeners(this.page);

      this.log('SUCCESS', 'BROWSER', `Browser initialized successfully (${this.browser.version()}).`);

      const target = initialUrl || 'https://www.google.com';
      await this.navigate(target, settings.actionTimeoutMs);

      return { success: true, url: this.page.url() };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown browser launch error';
      this.log('ERROR', 'BROWSER', `Failed to launch browser: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  }

  private setupPageListeners(page: Page): void {
    // 1. Console logs from webpage
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        this.log('ERROR', 'PLAYWRIGHT', `[Webpage Console Error] ${text}`);
      } else if (type === 'warning') {
        this.log('WARN', 'PLAYWRIGHT', `[Webpage Console Warn] ${text}`);
      }
    });

    // 2. Unhandled page errors (JS crashes)
    page.on('pageerror', (err) => {
      this.log('ERROR', 'PLAYWRIGHT', `[Uncaught Page Exception] ${err.message}`);
    });

    // 3. Failed network requests
    page.on('requestfailed', (req) => {
      const failure = req.failure();
      // Ignore aborts or favicon drops
      if (failure && !failure.errorText.includes('net::ERR_ABORTED')) {
        this.log('WARN', 'PLAYWRIGHT', `[Network Request Failed] ${req.url()} (${failure.errorText})`);
      }
    });

    // 4. Frame navigation
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        this.log('INFO', 'BROWSER', `Navigation event: ${frame.url()}`);
      }
    });

    // 5. Page close
    page.on('close', () => {
      this.log('WARN', 'BROWSER', 'Browser page closed.');
      this.page = null;
    });
  }

  public async navigate(url: string, timeoutMs: number = 30000): Promise<boolean> {
    if (!this.page) throw new Error('No active browser page. Launch browser first.');
    try {
      this.log('ACTION', 'BROWSER', `Navigating to: ${url}`);
      await this.page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: timeoutMs,
      });
      this.log('SUCCESS', 'BROWSER', `Loaded: ${this.page.url()} (${await this.page.title()})`);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.log('ERROR', 'BROWSER', `Navigation failed to ${url}: ${message}`);
      throw err;
    }
  }

  public async takeScreenshot(): Promise<string | null> {
    if (!this.page) return null;
    try {
      const buffer = await this.page.screenshot({ type: 'jpeg', quality: 80 });
      const base64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
      this.log('INFO', 'PLAYWRIGHT', 'Screenshot captured successfully.');
      return base64;
    } catch (err) {
      this.log('ERROR', 'PLAYWRIGHT', `Screenshot capture error: ${(err as Error).message}`);
      return null;
    }
  }

  public async getStatus(): Promise<{ isOpen: boolean; currentUrl?: string; title?: string }> {
    if (!this.page || this.page.isClosed()) {
      return { isOpen: false };
    }
    try {
      const currentUrl = this.page.url();
      const title = await this.page.title();
      return { isOpen: true, currentUrl, title };
    } catch {
      return { isOpen: false };
    }
  }

  public async close(): Promise<boolean> {
    try {
      if (this.context) {
        await this.context.close().catch(() => {});
        this.context = null;
      }
      if (this.browser) {
        await this.browser.close().catch(() => {});
        this.browser = null;
      }
      this.page = null;
      this.log('INFO', 'BROWSER', 'Browser closed.');
      return true;
    } catch (err) {
      this.log('ERROR', 'BROWSER', `Error closing browser: ${(err as Error).message}`);
      return false;
    }
  }

  public getPage(): Page | null {
    return this.page;
  }
}
