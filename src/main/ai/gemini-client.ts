import { GoogleGenerativeAI } from '@google/generative-ai';
import { ExecutionPlan, PlanStep, TestCase, TestSuite } from '../../common/types';
import { ALLOWED_ACTIONS } from '../../common/action-schema';

export interface AIDiagnosisResult {
  isWebsiteBug: boolean;
  canRetry: boolean;
  rootCause: string;
  healedSelector?: string;
  suggestion: string;
}

export class GeminiService {
  private apiKey: string;
  private modelName: string;

  constructor(apiKey: string, modelName: string = 'gemini-2.5-flash') {
    this.apiKey = apiKey;
    this.modelName = modelName;
  }

  private getClient(): GoogleGenerativeAI {
    return new GoogleGenerativeAI(this.apiKey);
  }

  /**
   * AI Automation Agent: Decomposes natural language instructions into validated Playwright steps.
   */
  public async planExecution(instruction: string, currentUrl?: string): Promise<PlanStep[]> {
    const ai = this.getClient();
    const model = ai.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const prompt = `You are a Senior Browser Automation Architect and Playwright Expert.
The user wants to accomplish the following instruction on a real visible browser:
"${instruction}"
Current browser URL (if any): "${currentUrl || 'none'}"

Your task:
1. Understand the user's intent.
2. Break it into individual sequential steps.
3. Every step MUST use an action from this strict allowlist:
   ${JSON.stringify(ALLOWED_ACTIONS)}
4. Provide clean CSS or text selectors, target URLs, keys, or text to type.
5. If an action involves purchases, payments, credit cards, or irreversible destructive actions, set "requiresConfirmation": true.
6. Support common Indian/global e-commerce sites (e.g. Flipkart, Amazon, Google, etc.). For Flipkart search, the search input selector is "input[name='q'], input[placeholder*='Search']".

Return JSON following this EXACT schema:
{
  "steps": [
    {
      "stepNumber": 1,
      "description": "Short human readable summary",
      "action": "NAVIGATE | CLICK | TYPE | PRESS_KEY | SCROLL | HOVER | SELECT_OPTION | SCREENSHOT | WAIT_FOR_ELEMENT | ASSERT_TEXT | ASSERT_VISIBLE | READ_PAGE_CONTENT | CLOSE_BROWSER",
      "params": {
        "url": "https://...",
        "selector": "CSS selector or text",
        "text": "text to type",
        "key": "Enter | Tab | Escape",
        "direction": "down | up",
        "amount": 500,
        "expectedText": "text to assert",
        "requiresConfirmation": false
      }
    }
  ]
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    if (!parsed.steps || !Array.isArray(parsed.steps)) {
      throw new Error('AI response did not contain an array of steps.');
    }

    return parsed.steps.map((s: any, idx: number) => ({
      id: `step-${idx + 1}-${Date.now()}`,
      stepNumber: idx + 1,
      description: s.description || `Step ${idx + 1}`,
      action: s.action,
      params: s.params || {},
      status: 'PENDING',
    }));
  }

  /**
   * Autonomous QA Module: Generates Positive, Negative, and Boundary test scenarios.
   */
  public async generateQASuite(instructions: string, targetUrl: string): Promise<TestSuite> {
    const ai = this.getClient();
    const model = ai.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const prompt = `You are an Autonomous QA Lead Engineer.
Generate a comprehensive QA Test Suite for the following instruction / feature:
"${instructions}"
Target Website URL: "${targetUrl}"

Requirements:
- Create a mixture of POSITIVE (happy path), NEGATIVE (error handling, invalid input), and BOUNDARY (edge cases, empty fields, formatting) scenarios.
- For each test case, define clear preconditions, numbered execution steps, and an expected assertion result.

Return JSON following this EXACT schema:
{
  "suiteName": "Concise Suite Title",
  "testCases": [
    {
      "title": "Clear test case title",
      "description": "What is being validated",
      "scenarioType": "POSITIVE | NEGATIVE | BOUNDARY | SECURITY",
      "preconditions": ["precondition 1", "precondition 2"],
      "steps": ["Step 1", "Step 2", "Step 3"],
      "expectedResult": "Precise expected outcome"
    }
  ]
}
`;

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());

    const cases: TestCase[] = (parsed.testCases || []).map((tc: any, idx: number) => ({
      id: `tc-${idx + 1}`,
      title: tc.title,
      description: tc.description,
      scenarioType: tc.scenarioType || 'POSITIVE',
      preconditions: tc.preconditions || [],
      steps: tc.steps || [],
      expectedResult: tc.expectedResult,
      status: 'NOT_RUN',
    }));

    return {
      id: `suite-${Date.now()}`,
      name: parsed.suiteName || `QA Suite: ${instructions.slice(0, 40)}`,
      targetUrl,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      summary: {
        total: cases.length,
        passed: 0,
        failed: 0,
        blocked: 0,
      },
      cases,
    };
  }

  /**
   * Error Detection & Analysis Agent: Diagnoses failures and determines self-healing options.
   */
  public async diagnoseFailure(
    goal: string,
    failedStep: PlanStep,
    errorMessage: string,
    domSummary: string
  ): Promise<AIDiagnosisResult> {
    const ai = this.getClient();
    const model = ai.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const prompt = `You are an Autonomous Self-Healing Automation AI Diagnostician.
A browser automation step failed during execution.

Goal: "${goal}"
Failed Step:
- Action: ${failedStep.action}
- Description: ${failedStep.description}
- Target Selector: ${failedStep.params.selector || 'N/A'}
- Error Message: "${errorMessage}"

Current Page Visible DOM Summary:
"""${domSummary.slice(0, 1500)}"""

Analyze the failure:
1. Is this a real website bug (broken script/404/500/unhandled crash) or a test selector/timing issue?
   (DO NOT classify empty search results or dynamic DOM ID changes as website bugs).
2. Can this failure be safely retried with a healed CSS selector or alternative text locator?
3. Suggest an alternative locator or remediation if possible.

Return JSON following this EXACT schema:
{
  "isWebsiteBug": false,
  "canRetry": true,
  "rootCause": "Clear explanation of failure cause",
  "healedSelector": "alternative CSS selector or null",
  "suggestion": "Actionable advice"
}
`;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  }
}
