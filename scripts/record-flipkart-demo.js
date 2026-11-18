const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

async function recordFlipkartDemo() {
  const videoDir = path.resolve(__dirname, '../media/videos');
  const screenshotDir = path.resolve(__dirname, '../media/screenshots');
  fs.mkdirSync(videoDir, { recursive: true });
  fs.mkdirSync(screenshotDir, { recursive: true });

  console.log('=== Starting Flipkart Automation with Video Recording ===');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
    slowMo: 150, // smooth visual pacing for the video
    args: ['--window-size=1280,720', '--no-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: videoDir,
      size: { width: 1280, height: 720 },
    },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  console.log('Step 1: Navigating to Flipkart...');
  await page.goto('https://www.flipkart.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);

  // Close login dialog if present
  try {
    const closeBtn = page.locator('span[role="button"]:has-text("✕"), button._2KpZ6l._2doB4z, span._30XB9F').first();
    if (await closeBtn.isVisible({ timeout: 2000 })) {
      console.log('Dismissing Flipkart login overlay...');
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
  } catch {}

  // Capture homepage screenshot
  await page.screenshot({ path: path.join(screenshotDir, 'flipkart_homepage.png') });
  console.log('Captured homepage screenshot.');

  console.log('Step 2: Locating search box...');
  const searchInput = page.locator('input[name="q"], input[title*="Search"], input[placeholder*="Search"]').first();
  await searchInput.waitFor({ state: 'visible', timeout: 10000 });
  await searchInput.click();
  await page.waitForTimeout(500);

  console.log('Step 3: Typing "iPhone 18 Pro Max"...');
  await searchInput.fill('');
  await searchInput.type('iPhone 18 Pro Max', { delay: 100 });
  await page.waitForTimeout(1000);

  console.log('Step 4: Pressing Enter to search...');
  await page.keyboard.press('Enter');

  console.log('Step 5: Waiting for search results to load...');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2500);

  // Scroll down to display products
  console.log('Step 6: Scrolling search results to inspect products...');
  await page.evaluate(() => window.scrollBy({ top: 500, behavior: 'smooth' }));
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollBy({ top: 500, behavior: 'smooth' }));
  await page.waitForTimeout(1500);

  // Capture results screenshot
  const resultScreenshotPath = path.join(screenshotDir, 'flipkart_search_results.png');
  await page.screenshot({ path: resultScreenshotPath });
  console.log('Captured search results screenshot:', resultScreenshotPath);

  console.log('Step 7: Closing browser and saving video...');
  const videoObj = page.video();
  await page.close();
  await context.close();
  await browser.close();

  if (videoObj) {
    const tempVideoPath = await videoObj.path();
    const finalVideoPath = path.join(videoDir, 'flipkart_automation_demo.webm');
    fs.copyFileSync(tempVideoPath, finalVideoPath);
    console.log('Video saved successfully to:', finalVideoPath);
  }

  console.log('=== Flipkart Automation Demo Completed Successfully! ===');
}

recordFlipkartDemo().catch((err) => {
  console.error('Error during demo recording:', err);
  process.exit(1);
});
