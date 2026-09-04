import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const html = pathToFileURL(resolve("/workspace/.grok/favicon-proof.html")).href;
const out = resolve("/workspace/.grok/favicon-proof.png");
const browser = await chromium.launch({
  executablePath:
    "/opt/pw-browsers/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 1100, height: 420 }, deviceScaleFactor: 2 });
await page.goto(html, { waitUntil: "load" });
await page.screenshot({ path: out, type: "png" });
await browser.close();
console.log("wrote", out);
