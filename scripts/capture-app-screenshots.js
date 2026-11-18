const { chromium } = require('playwright-core');
const http = require('http');
const path = require('path');
const fs = require('fs');

function startStaticServer(distDir, port) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    const filePath = path.join(distDir, reqPath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        // Fallback to index.html for SPA
        fs.readFile(path.join(distDir, 'index.html'), (err2, fallback) => {
          if (err2) {
            res.writeHead(404);
            res.end('Not found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(fallback);
          }
        });
      } else {
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        res.end(data);
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

async function captureAllScreenshots() {
  const distDir = path.resolve(__dirname, '../dist');
  const screenshotDir = path.resolve(__dirname, '../media/screenshots');
  fs.mkdirSync(screenshotDir, { recursive: true });

  const port = 49152;
  const server = await startStaticServer(distDir, port);
  console.log(`Static server running on http://localhost:${port}`);

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`http://localhost:${port}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Dashboard View
  await page.screenshot({ path: path.join(screenshotDir, 'app_dashboard.png') });
  console.log('Saved app_dashboard.png');

  // 2. AI Automation Tab
  const automationNav = page.locator('button:has-text("AI Automation")');
  await automationNav.click();
  await page.waitForTimeout(600);
  const promptInput = page.locator('input[placeholder*="Open Chrome"]');
  await promptInput.fill('Open Chrome, navigate to Flipkart, search for iPhone 18 Pro Max, inspect the search results and close the browser.');
  await page.screenshot({ path: path.join(screenshotDir, 'app_ai_automation.png') });
  console.log('Saved app_ai_automation.png');

  // 3. QA Engine Tab
  const qaNav = page.locator('button:has-text("QA Engine")');
  await qaNav.click();
  await page.waitForTimeout(600);
  const generateBtn = page.locator('button:has-text("Generate Tests")');
  await generateBtn.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotDir, 'app_qa_engine.png') });
  console.log('Saved app_qa_engine.png');

  // 4. Browser View Tab
  const browserNav = page.locator('button:has-text("Browser View")');
  await browserNav.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(screenshotDir, 'app_browser_view.png') });
  console.log('Saved app_browser_view.png');

  // 5. Reports Tab
  const reportsNav = page.locator('button:has-text("QA Reports")');
  await reportsNav.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(screenshotDir, 'app_qa_reports.png') });
  console.log('Saved app_qa_reports.png');

  // 6. Settings Tab
  const settingsNav = page.locator('button:has-text("Settings")');
  await settingsNav.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(screenshotDir, 'app_settings.png') });
  console.log('Saved app_settings.png');

  await browser.close();
  server.close();
  console.log('=== All App Screenshots Captured with High Fidelity! ===');
}

captureAllScreenshots().catch((err) => {
  console.error('Failed to capture screenshots:', err);
  process.exit(1);
});
