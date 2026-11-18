import { Page } from 'playwright-core';
import { PlanStep, LogEntry } from '../../common/types';
import { validatePlanStep } from '../../common/action-schema';
import { DomInspector } from './dom-inspector';

export type LogBroadcaster = (log: LogEntry) => void;

export class ActionExecutor {
  private broadcastLog: LogBroadcaster;

  constructor(broadcaster: LogBroadcaster) {
    this.broadcastLog = broadcaster;
  }

  private log(
    level: LogEntry['level'],
    category: LogEntry['category'],
    message: string,
    metadata?: Record<string, unknown>,
    screenshotUrl?: string
  ): void {
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

  public async executeStep(
    page: Page,
    step: PlanStep,
    defaultTimeoutMs: number = 15000
  ): Promise<{ success: boolean; result?: unknown; error?: string; screenshot?: string }> {
    const startTime = Date.now();

    // 1. Schema validation
    const validation = validatePlanStep(step);
    if (!validation.valid) {
      const err = `Security / Schema Validation Error: ${validation.error}`;
      this.log('ERROR', 'SYSTEM', err);
      return { success: false, error: err };
    }

    const timeout = step.params.timeout || defaultTimeoutMs;

    this.log(
      'ACTION',
      'PLAYWRIGHT',
      `[Step ${step.stepNumber}] Executing ${step.action}: "${step.description}"`
    );

    try {
      let stepResult: unknown = null;

      switch (step.action) {
        case 'NAVIGATE': {
          const url = step.params.url!;
          this.log('INFO', 'BROWSER', `Navigating to URL: ${url}`);
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
          stepResult = { url: page.url(), title: await page.title() };
          this.log('SUCCESS', 'BROWSER', `Navigation complete: ${page.url()}`);
          break;
        }

        case 'CLICK': {
          const selector = step.params.selector!;
          this.log('INFO', 'PLAYWRIGHT', `Locating target for click: "${selector}"`);
          const locator = await DomInspector.resolveLocator(page, selector, timeout);
          await locator.scrollIntoViewIfNeeded();
          await locator.click({ timeout });
          this.log('SUCCESS', 'PLAYWRIGHT', `Clicked element matching: "${selector}"`);
          break;
        }

        case 'TYPE': {
          const selector = step.params.selector!;
          const text = step.params.text!;
          this.log('INFO', 'PLAYWRIGHT', `Locating target to type: "${selector}"`);
          const locator = await DomInspector.resolveLocator(page, selector, timeout);
          await locator.scrollIntoViewIfNeeded();
          await locator.fill(''); // clear existing
          await locator.type(text, { delay: 50 }); // realistic human typing
          this.log('SUCCESS', 'PLAYWRIGHT', `Typed "${text}" into "${selector}"`);
          break;
        }

        case 'PRESS_KEY': {
          const key = step.params.key || 'Enter';
          this.log('INFO', 'PLAYWRIGHT', `Pressing keyboard key: ${key}`);
          await page.keyboard.press(key);
          this.log('SUCCESS', 'PLAYWRIGHT', `Pressed key: ${key}`);
          break;
        }

        case 'SCROLL': {
          const direction = step.params.direction || 'down';
          const amount = step.params.amount || 600;
          const deltaY = direction === 'down' ? amount : -amount;
          this.log('INFO', 'PLAYWRIGHT', `Scrolling ${direction} by ${amount}px`);
          await page.evaluate((y) => window.scrollBy({ top: y, behavior: 'smooth' }), deltaY);
          await page.waitForTimeout(400); // allow scroll animation to settle
          this.log('SUCCESS', 'PLAYWRIGHT', `Scrolled ${direction}`);
          break;
        }

        case 'HOVER': {
          const selector = step.params.selector!;
          this.log('INFO', 'PLAYWRIGHT', `Hovering over: "${selector}"`);
          const locator = await DomInspector.resolveLocator(page, selector, timeout);
          await locator.scrollIntoViewIfNeeded();
          await locator.hover({ timeout });
          this.log('SUCCESS', 'PLAYWRIGHT', `Hovered over element`);
          break;
        }

        case 'SELECT_OPTION': {
          const selector = step.params.selector!;
          const value = step.params.value || step.params.text || '';
          this.log('INFO', 'PLAYWRIGHT', `Selecting dropdown option "${value}" in "${selector}"`);
          const locator = await DomInspector.resolveLocator(page, selector, timeout);
          await locator.selectOption({ label: value }).catch(() => locator.selectOption({ value }));
          this.log('SUCCESS', 'PLAYWRIGHT', `Option selected: ${value}`);
          break;
        }

        case 'SCREENSHOT': {
          const buffer = await page.screenshot({ type: 'jpeg', quality: 80 });
          const base64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
          stepResult = { screenshot: base64 };
          this.log('SUCCESS', 'PLAYWRIGHT', 'Evidence screenshot captured.', undefined, base64);
          return { success: true, result: stepResult, screenshot: base64 };
        }

        case 'WAIT_FOR_ELEMENT': {
          const selector = step.params.selector!;
          this.log('INFO', 'PLAYWRIGHT', `Waiting for element to be visible: "${selector}"`);
          const locator = await DomInspector.resolveLocator(page, selector, timeout);
          await locator.waitFor({ state: 'visible', timeout });
          this.log('SUCCESS', 'PLAYWRIGHT', `Element is visible: "${selector}"`);
          break;
        }

        case 'ASSERT_TEXT': {
          const selector = step.params.selector!;
          const expected = step.params.expectedText!;
          this.log('INFO', 'PLAYWRIGHT', `Asserting text contains "${expected}" in "${selector}"`);
          const locator = await DomInspector.resolveLocator(page, selector, timeout);
          const actualText = await locator.innerText({ timeout });
          if (!actualText.toLowerCase().includes(expected.toLowerCase())) {
            throw new Error(`Text assertion failed. Expected "${expected}", but found "${actualText.trim()}"`);
          }
          this.log('SUCCESS', 'PLAYWRIGHT', `Assertion PASS: element contains "${expected}"`);
          break;
        }

        case 'ASSERT_VISIBLE': {
          const selector = step.params.selector!;
          this.log('INFO', 'PLAYWRIGHT', `Asserting element is visible: "${selector}"`);
          const locator = await DomInspector.resolveLocator(page, selector, timeout);
          const isVisible = await locator.isVisible();
          if (!isVisible) {
            throw new Error(`Visibility assertion failed for element: "${selector}"`);
          }
          this.log('SUCCESS', 'PLAYWRIGHT', `Assertion PASS: element is visible.`);
          break;
        }

        case 'READ_PAGE_CONTENT': {
          const summary = await DomInspector.getPageTextSummary(page);
          stepResult = { text: summary };
          this.log('SUCCESS', 'PLAYWRIGHT', `Extracted page content (${summary.length} characters)`);
          break;
        }

        case 'CLOSE_BROWSER': {
          this.log('INFO', 'BROWSER', 'Executing instruction to close browser session');
          // Will be handled by BrowserManager.close()
          break;
        }

        default:
          throw new Error(`Unsupported action: ${step.action}`);
      }

      // Capture screenshot evidence after key actions
      let screenshot: string | undefined;
      try {
        const buffer = await page.screenshot({ type: 'jpeg', quality: 75 });
        screenshot = `data:image/jpeg;base64,${buffer.toString('base64')}`;
      } catch {}

      const duration = Date.now() - startTime;
      this.log('SUCCESS', 'SYSTEM', `Step ${step.stepNumber} completed in ${duration}ms`);

      return {
        success: true,
        result: stepResult,
        screenshot,
      };
    } catch (err: unknown) {
      const duration = Date.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.log('ERROR', 'PLAYWRIGHT', `Step ${step.stepNumber} failed (${duration}ms): ${errorMsg}`);

      // Capture failure screenshot evidence
      let failureScreenshot: string | undefined;
      try {
        const buffer = await page.screenshot({ type: 'jpeg', quality: 75 });
        failureScreenshot = `data:image/jpeg;base64,${buffer.toString('base64')}`;
      } catch {}

      return {
        success: false,
        error: errorMsg,
        screenshot: failureScreenshot,
      };
    }
  }
}
