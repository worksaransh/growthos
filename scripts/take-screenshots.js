/**
 * GrowthOS — Auto Screenshot Tool
 * Run: node scripts/take-screenshots.js
 * Requires: npm install puppeteer (one-time)
 *
 * Saves all screenshots to docs/screenshots/
 * Make sure frontend is running on localhost:3000 first.
 */

const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const OUT_DIR = path.join(__dirname, "..", "docs", "screenshots");
fs.mkdirSync(OUT_DIR, { recursive: true });

// Pages to screenshot. For dashboard sub-pages we click the sidebar button.
const PAGES = [
  {
    url: "http://localhost:3000",
    file: "landing.png",
    waitMs: 3000,
  },
  {
    url: "http://localhost:3000/dashboard",
    file: "dashboard.png",
    waitMs: 4000,
  },
  {
    url: "http://localhost:3000/dashboard",
    file: "profit-engine.png",
    waitMs: 4000,
    clickButton: "Profit Engine",
    waitAfterMs: 2000,
  },
  {
    url: "http://localhost:3000/dashboard",
    file: "founder-ai.png",
    waitMs: 4000,
    clickButton: "Founder AI",
    waitAfterMs: 2000,
  },
  {
    url: "http://localhost:3000/dashboard",
    file: "ads-intelligence.png",
    waitMs: 4000,
    clickButton: "Ads Intelligence",
    waitAfterMs: 2000,
  },
  {
    url: "http://localhost:3000/settings/integrations",
    file: "integrations.png",
    waitMs: 5000,
  },
  {
    url: "http://localhost:3000/superadmin",
    file: "superadmin.png",
    waitMs: 3000,
  },
  {
    url: "http://localhost:3000/admin",
    file: "admin.png",
    waitMs: 3000,
  },
];

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  console.log("🚀 Starting GrowthOS screenshot capture...\n");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  for (const cfg of PAGES) {
    console.log(`📸 Capturing: ${cfg.file} (${cfg.url})`);

    await page.goto(cfg.url, { waitUntil: "networkidle2", timeout: 30000 });
    await sleep(cfg.waitMs);

    // Click a sidebar button if needed (for dashboard sub-pages)
    if (cfg.clickButton) {
      await page.evaluate((label) => {
        const btn = Array.from(document.querySelectorAll("button")).find(
          (b) => b.textContent?.trim() === label
        );
        btn?.click();
      }, cfg.clickButton);
      await sleep(cfg.waitAfterMs || 2000);
    }

    const outPath = path.join(OUT_DIR, cfg.file);
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`   ✅ Saved → docs/screenshots/${cfg.file}`);
  }

  await browser.close();

  console.log("\n✅ All screenshots saved to docs/screenshots/");
  console.log("Now run:");
  console.log("  git add docs/screenshots/");
  console.log('  git commit -m "docs: add screenshots"');
  console.log("  git push origin main");
})();
