/**
 * Generates DocCompare Developer Handoff PDF for FastAPI + MongoDB migration.
 * Run: node scripts/generate-handoff-pdf.mjs
 */
import { chromium } from "playwright";
import { readFileSync, mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const htmlPath = join(root, "docs", "HANDOFF_FASTAPI_MIGRATION.html");
const outPath = join(root, "docs", "DocCompare-Developer-Handoff-FastAPI-MongoDB.pdf");

const html = readFileSync(htmlPath, "utf-8");

mkdirSync(join(root, "docs"), { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.setContent(html, { waitUntil: "networkidle" });

const pdf = await page.pdf({
  format: "A4",
  printBackground: true,
  margin: { top: "18mm", right: "15mm", bottom: "18mm", left: "15mm" },
  displayHeaderFooter: true,
  headerTemplate: `<div style="font-size:8px;width:100%;text-align:center;color:#64748b;padding:0 15mm;">
    DocCompare — Developer Handoff · FastAPI + MongoDB Migration
  </div>`,
  footerTemplate: `<div style="font-size:8px;width:100%;text-align:center;color:#64748b;padding:0 15mm;">
    Page <span class="pageNumber"></span> of <span class="totalPages"></span> · Generated June 2026
  </div>`,
});

await browser.close();

writeFileSync(outPath, pdf);
console.log(`PDF generated: ${outPath}`);
