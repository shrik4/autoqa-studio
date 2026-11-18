import { ActionType, PlanStep } from './types';

export const ALLOWED_ACTIONS: readonly ActionType[] = [
  'NAVIGATE',
  'CLICK',
  'TYPE',
  'PRESS_KEY',
  'SCROLL',
  'HOVER',
  'SELECT_OPTION',
  'SCREENSHOT',
  'WAIT_FOR_ELEMENT',
  'ASSERT_TEXT',
  'ASSERT_VISIBLE',
  'READ_PAGE_CONTENT',
  'CLOSE_BROWSER',
] as const;

export function validatePlanStep(step: Partial<PlanStep>): { valid: boolean; error?: string } {
  if (!step.action || !ALLOWED_ACTIONS.includes(step.action)) {
    return { valid: false, error: `Invalid or disallowed action type: ${step.action}` };
  }

  if (step.action === 'NAVIGATE') {
    if (!step.params?.url) return { valid: false, error: 'NAVIGATE action requires a valid url parameter.' };
    try {
      const parsed = new URL(step.params.url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { valid: false, error: `Disallowed URL protocol: ${parsed.protocol}` };
      }
    } catch {
      return { valid: false, error: `Malformed URL: ${step.params.url}` };
    }
  }

  if (['CLICK', 'HOVER', 'WAIT_FOR_ELEMENT', 'ASSERT_VISIBLE'].includes(step.action)) {
    if (!step.params?.selector) {
      return { valid: false, error: `${step.action} requires a target selector.` };
    }
  }

  if (step.action === 'TYPE') {
    if (!step.params?.selector || step.params.text === undefined) {
      return { valid: false, error: 'TYPE action requires both selector and text parameters.' };
    }
  }

  if (step.action === 'ASSERT_TEXT') {
    if (!step.params?.selector || !step.params.expectedText) {
      return { valid: false, error: 'ASSERT_TEXT requires selector and expectedText parameters.' };
    }
  }

  return { valid: true };
}
