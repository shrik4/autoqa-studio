import { Page, Locator } from 'playwright-core';

export interface InteractiveElementInfo {
  index: number;
  tagName: string;
  role?: string;
  text?: string;
  placeholder?: string;
  name?: string;
  id?: string;
  selector: string;
  boundingBox?: { x: number; y: number; width: number; height: number } | null;
}

export class DomInspector {
  /**
   * Resiliently finds an element using multiple locator fallback strategies:
   * 1. Exact CSS/XPath if standard selector syntax
   * 2. Text / Placeholder / Role heuristic if natural description
   * 3. Visible fallback
   */
  public static async resolveLocator(page: Page, selectorOrDescription: string, timeoutMs: number = 8000): Promise<Locator> {
    const s = selectorOrDescription.trim();

    // 1. If it's explicitly XPath
    if (s.startsWith('//') || s.startsWith('xpath=')) {
      const loc = page.locator(s);
      await loc.first().waitFor({ state: 'attached', timeout: timeoutMs });
      return loc.first();
    }

    // 2. Try standard CSS selector
    try {
      const loc = page.locator(s);
      const count = await loc.count();
      if (count > 0) {
        await loc.first().waitFor({ state: 'attached', timeout: Math.min(timeoutMs, 3000) });
        return loc.first();
      }
    } catch {
      // Not a valid CSS selector, proceed to heuristics
    }

    // 3. Heuristic: Placeholder
    try {
      const byPlaceholder = page.getByPlaceholder(s, { exact: false });
      if ((await byPlaceholder.count()) > 0) {
        return byPlaceholder.first();
      }
    } catch {}

    // 4. Heuristic: Text content
    try {
      const byText = page.getByText(s, { exact: false });
      if ((await byText.count()) > 0) {
        return byText.first();
      }
    } catch {}

    // 5. Heuristic: Role / Label
    try {
      const byRole = page.getByRole('button', { name: s });
      if ((await byRole.count()) > 0) {
        return byRole.first();
      }
    } catch {}

    // Fallback: Default locator with given string
    const fallbackLoc = page.locator(s).first();
    await fallbackLoc.waitFor({ state: 'attached', timeout: timeoutMs });
    return fallbackLoc;
  }

  /**
   * Extracts a structured list of visible interactive elements from the current page.
   * Useful for AI inspection and autonomous decision-making.
   */
  public static async getInteractiveElements(page: Page): Promise<InteractiveElementInfo[]> {
    try {
      return await page.evaluate(() => {
        const elements: Array<{
          index: number;
          tagName: string;
          role?: string;
          text?: string;
          placeholder?: string;
          name?: string;
          id?: string;
          selector: string;
        }> = [];

        const candidates = document.querySelectorAll<HTMLElement>(
          'button, input, a[href], select, textarea, [role="button"], [role="link"], [role="searchbox"]'
        );

        let idx = 0;
        candidates.forEach((el) => {
          // Check if element is visible
          const rect = el.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden';
          if (!isVisible) return;

          const text = (el.innerText || el.textContent || '').trim().slice(0, 50);
          const placeholder = el.getAttribute('placeholder') || undefined;
          const name = el.getAttribute('name') || undefined;
          const id = el.id || undefined;
          const role = el.getAttribute('role') || undefined;
          const tagName = el.tagName.toLowerCase();

          // Generate a clean selector
          let selector = '';
          if (id) {
            selector = `#${id}`;
          } else if (name) {
            selector = `${tagName}[name="${name}"]`;
          } else if (placeholder) {
            selector = `${tagName}[placeholder="${placeholder}"]`;
          } else if (text && text.length > 2 && text.length < 30) {
            selector = `text="${text}"`;
          } else {
            selector = tagName;
          }

          elements.push({
            index: idx++,
            tagName,
            role,
            text: text || undefined,
            placeholder,
            name,
            id,
            selector,
          });
        });

        return elements.slice(0, 50); // limit to top 50 interactive elements
      });
    } catch (err) {
      console.error('Failed to inspect interactive elements:', err);
      return [];
    }
  }

  /**
   * Reads visible text from the page, sanitizing script tags, styles, and whitespace.
   */
  public static async getPageTextSummary(page: Page): Promise<string> {
    try {
      return await page.evaluate(() => {
        const clone = document.body.cloneNode(true) as HTMLElement;
        // Remove non-content elements
        const scripts = clone.querySelectorAll('script, style, noscript, svg');
        scripts.forEach((s) => s.remove());
        return (clone.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 3000);
      });
    } catch (err) {
      return `Failed to read page text: ${(err as Error).message}`;
    }
  }
}
