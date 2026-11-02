import { chromium, devices } from "@playwright/test";
import { writeFile, mkdir } from "node:fs/promises";
const browser = await chromium.launch();
const report = [];
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext(
      mobile
        ? devices["iPhone 13"]
        : { viewport: { width: 1440, height: 1000 } },
    );
    const page = await context.newPage();
    await page.goto(process.env.TEST_BASE_URL || "http://127.0.0.1:3000");
    await page
      .locator(".adventure-transition[data-ready=true]")
      .waitFor({ state: "attached" });
    await page
      .locator(".adventure-transition[data-engine=ready]")
      .waitFor({ state: "attached", timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    // Frame timings are measured without screenshots, traces or CPU throttling.
    const measuredThemes = new Set();
    for (let run = 0; (run < 3 || measuredThemes.size < 3) && run < 9; run++) {
      await page.evaluate(() => {
        const s = window;
        s.__frames = [];
        s.__sampling = true;
        const token = (s.__sampleToken = (s.__sampleToken || 0) + 1);
        let previous = performance.now();
        function tick(now) {
          if (!s.__sampling || s.__sampleToken !== token) return;
          const overlay = document.querySelector(".adventure-transition");
          if (overlay?.style.visibility === "visible")
            s.__frames.push(now - previous);
          previous = now;
          requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
      await page
        .getByRole("link", { name: "Experience skydiving", exact: true })
        .click();
      await page.locator(".adventure-transition").waitFor({ state: "hidden" });
      const result = await page.evaluate(() => {
        window.__sampling = false;
        const frames = window.__frames
          .filter((n) => n > 0)
          .sort((a, b) => a - b);
        return {
          theme: document.querySelector(".adventure-transition").dataset.theme,
          renderer: document.querySelector(".adventure-transition").dataset
            .renderer,
          canvas: {
            width: document.querySelector(".immersive-canvas").width,
            height: document.querySelector(".immersive-canvas").height,
          },
          samples: frames.length,
          median: frames[Math.floor(frames.length * 0.5)],
          p95: frames[Math.floor(frames.length * 0.95)],
          max: Math.max(...frames),
          over33ms: frames.filter((n) => n > 33.5).length,
        };
      });
      measuredThemes.add(result.theme);
      report.push({ viewport: mobile ? "mobile" : "desktop", run, ...result });
    }
    await context.close();
  }
} finally {
  await browser.close();
}
await mkdir("work", { recursive: true });
await writeFile("work/motion-report.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
