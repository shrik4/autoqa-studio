import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { ExecutionPlan, LogEntry, QAReport, TestCase, TestSuite } from '../../common/types';

export class DatabaseService {
  private static instance: DatabaseService;
  private db: Database | null = null;
  private dbFilePath: string;

  private constructor() {
    this.dbFilePath = path.join(app.getPath('userData'), 'autoqa.sqlite');
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async init(): Promise<void> {
    try {
      const SQL = await initSqlJs();
      if (fs.existsSync(this.dbFilePath)) {
        const fileBuffer = fs.readFileSync(this.dbFilePath);
        this.db = new SQL.Database(fileBuffer);
      } else {
        this.db = new SQL.Database();
      }

      this.createTables();
      this.persist();
    } catch (err) {
      console.error('Failed to initialize SQLite database:', err);
    }
  }

  private createTables(): void {
    if (!this.db) return;

    this.db.run(`
      CREATE TABLE IF NOT EXISTS runs (
        id TEXT PRIMARY KEY,
        goal TEXT NOT NULL,
        status TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        completedAt TEXT,
        currentStepIndex INTEGER DEFAULT 0,
        summary TEXT,
        stepsJson TEXT NOT NULL,
        statsJson TEXT
      );

      CREATE TABLE IF NOT EXISTS logs (
        id TEXT PRIMARY KEY,
        runId TEXT,
        timestamp TEXT NOT NULL,
        level TEXT NOT NULL,
        category TEXT NOT NULL,
        message TEXT NOT NULL,
        metadataJson TEXT,
        screenshotUrl TEXT
      );

      CREATE TABLE IF NOT EXISTS test_suites (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        targetUrl TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        completedAt TEXT,
        status TEXT NOT NULL,
        summaryJson TEXT
      );

      CREATE TABLE IF NOT EXISTS test_cases (
        id TEXT PRIMARY KEY,
        suiteId TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        scenarioType TEXT NOT NULL,
        preconditionsJson TEXT,
        stepsJson TEXT,
        expectedResult TEXT,
        actualResult TEXT,
        status TEXT NOT NULL,
        durationMs INTEGER,
        errorTrace TEXT,
        evidenceScreenshot TEXT,
        FOREIGN KEY (suiteId) REFERENCES test_suites(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        runId TEXT,
        title TEXT NOT NULL,
        targetUrl TEXT,
        timestamp TEXT NOT NULL,
        durationMs INTEGER,
        reportJson TEXT NOT NULL
      );
    `);
  }

  public persist(): void {
    if (!this.db) return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.mkdirSync(path.dirname(this.dbFilePath), { recursive: true });
      fs.writeFileSync(this.dbFilePath, buffer);
    } catch (err) {
      console.error('Failed to persist SQLite database to disk:', err);
    }
  }

  // --- Runs Repository ---

  public saveRun(plan: ExecutionPlan): void {
    if (!this.db) return;
    try {
      this.db.run(
        `INSERT OR REPLACE INTO runs (id, goal, status, createdAt, currentStepIndex, summary, stepsJson, statsJson)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          plan.id,
          plan.goal,
          plan.status,
          plan.createdAt,
          plan.currentStepIndex || 0,
          plan.summary || '',
          JSON.stringify(plan.steps),
          JSON.stringify(plan.stats || {}),
        ]
      );
      this.persist();
    } catch (err) {
      console.error('Error saving run to SQLite:', err);
    }
  }

  public getRuns(): ExecutionPlan[] {
    if (!this.db) return [];
    try {
      const res = this.db.exec('SELECT * FROM runs ORDER BY createdAt DESC LIMIT 50');
      if (!res.length || !res[0].values) return [];

      const columns = res[0].columns;
      return res[0].values.map((row) => {
        const obj: Record<string, unknown> = {};
        columns.forEach((col, idx) => {
          obj[col] = row[idx];
        });

        return {
          id: String(obj.id),
          goal: String(obj.goal),
          status: obj.status as ExecutionPlan['status'],
          createdAt: String(obj.createdAt),
          currentStepIndex: Number(obj.currentStepIndex || 0),
          summary: obj.summary ? String(obj.summary) : undefined,
          steps: obj.stepsJson ? JSON.parse(String(obj.stepsJson)) : [],
          stats: obj.statsJson ? JSON.parse(String(obj.statsJson)) : undefined,
        };
      });
    } catch (err) {
      console.error('Error fetching runs from SQLite:', err);
      return [];
    }
  }

  public deleteRun(id: string): boolean {
    if (!this.db) return false;
    try {
      this.db.run('DELETE FROM runs WHERE id = ?', [id]);
      this.db.run('DELETE FROM logs WHERE runId = ?', [id]);
      this.persist();
      return true;
    } catch {
      return false;
    }
  }

  public clearAllRuns(): boolean {
    if (!this.db) return false;
    try {
      this.db.run('DELETE FROM runs');
      this.db.run('DELETE FROM logs');
      this.persist();
      return true;
    } catch {
      return false;
    }
  }

  // --- Logs Repository ---

  public saveLog(log: LogEntry, runId?: string): void {
    if (!this.db) return;
    try {
      this.db.run(
        `INSERT INTO logs (id, runId, timestamp, level, category, message, metadataJson, screenshotUrl)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          log.id,
          runId || null,
          log.timestamp,
          log.level,
          log.category,
          log.message,
          log.metadata ? JSON.stringify(log.metadata) : null,
          log.screenshotUrl || null,
        ]
      );
    } catch (err) {
      console.error('Error saving log to SQLite:', err);
    }
  }

  // --- Test Suites & Cases ---

  public saveTestSuite(suite: TestSuite): void {
    if (!this.db) return;
    try {
      this.db.run(
        `INSERT OR REPLACE INTO test_suites (id, name, targetUrl, createdAt, completedAt, status, summaryJson)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          suite.id,
          suite.name,
          suite.targetUrl,
          suite.createdAt,
          suite.completedAt || null,
          suite.status,
          suite.summary ? JSON.stringify(suite.summary) : null,
        ]
      );

      for (const tc of suite.cases) {
        this.db.run(
          `INSERT OR REPLACE INTO test_cases (id, suiteId, title, description, scenarioType, preconditionsJson, stepsJson, expectedResult, actualResult, status, durationMs, errorTrace, evidenceScreenshot)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            tc.id,
            suite.id,
            tc.title,
            tc.description,
            tc.scenarioType,
            JSON.stringify(tc.preconditions || []),
            JSON.stringify(tc.steps || []),
            tc.expectedResult,
            tc.actualResult || null,
            tc.status,
            tc.durationMs || null,
            tc.errorTrace || null,
            tc.evidenceScreenshot || null,
          ]
        );
      }

      this.persist();
    } catch (err) {
      console.error('Error saving test suite to SQLite:', err);
    }
  }

  public getTestSuites(): TestSuite[] {
    if (!this.db) return [];
    try {
      const suiteRes = this.db.exec('SELECT * FROM test_suites ORDER BY createdAt DESC LIMIT 20');
      if (!suiteRes.length || !suiteRes[0].values) return [];

      const suites: TestSuite[] = [];
      const suiteCols = suiteRes[0].columns;

      for (const sRow of suiteRes[0].values) {
        const sObj: Record<string, unknown> = {};
        suiteCols.forEach((col, idx) => (sObj[col] = sRow[idx]));
        const suiteId = String(sObj.id);

        // Fetch test cases for this suite
        const casesRes = this.db.exec(`SELECT * FROM test_cases WHERE suiteId = '${suiteId}'`);
        const cases: TestCase[] = [];

        if (casesRes.length && casesRes[0].values) {
          const caseCols = casesRes[0].columns;
          for (const cRow of casesRes[0].values) {
            const cObj: Record<string, unknown> = {};
            caseCols.forEach((col, idx) => (cObj[col] = cRow[idx]));
            cases.push({
              id: String(cObj.id),
              title: String(cObj.title),
              description: String(cObj.description || ''),
              scenarioType: cObj.scenarioType as TestCase['scenarioType'],
              preconditions: cObj.preconditionsJson ? JSON.parse(String(cObj.preconditionsJson)) : [],
              steps: cObj.stepsJson ? JSON.parse(String(cObj.stepsJson)) : [],
              expectedResult: String(cObj.expectedResult || ''),
              actualResult: cObj.actualResult ? String(cObj.actualResult) : undefined,
              status: cObj.status as TestCase['status'],
              durationMs: cObj.durationMs ? Number(cObj.durationMs) : undefined,
              errorTrace: cObj.errorTrace ? String(cObj.errorTrace) : undefined,
              evidenceScreenshot: cObj.evidenceScreenshot ? String(cObj.evidenceScreenshot) : undefined,
            });
          }
        }

        suites.push({
          id: suiteId,
          name: String(sObj.name),
          targetUrl: String(sObj.targetUrl),
          createdAt: String(sObj.createdAt),
          completedAt: sObj.completedAt ? String(sObj.completedAt) : undefined,
          status: sObj.status as TestSuite['status'],
          summary: sObj.summaryJson ? JSON.parse(String(sObj.summaryJson)) : undefined,
          cases,
        });
      }

      return suites;
    } catch (err) {
      console.error('Error fetching test suites from SQLite:', err);
      return [];
    }
  }

  // --- Reports Repository ---

  public saveReport(report: QAReport): void {
    if (!this.db) return;
    try {
      this.db.run(
        `INSERT OR REPLACE INTO reports (id, runId, title, targetUrl, timestamp, durationMs, reportJson)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          report.id,
          report.runId,
          report.title,
          report.targetUrl,
          report.timestamp,
          report.durationMs,
          JSON.stringify(report),
        ]
      );
      this.persist();
    } catch (err) {
      console.error('Error saving report to SQLite:', err);
    }
  }

  public getReports(): QAReport[] {
    if (!this.db) return [];
    try {
      const res = this.db.exec('SELECT reportJson FROM reports ORDER BY timestamp DESC LIMIT 20');
      if (!res.length || !res[0].values) return [];
      return res[0].values.map((row) => JSON.parse(String(row[0])));
    } catch (err) {
      console.error('Error fetching reports from SQLite:', err);
      return [];
    }
  }
}
