import { chromium, devices } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const baseURL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const browser = await chromium.launch();
const results = [];
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext(mobile ? devices['iPhone 13'] : {viewport:{width:1440,height:1000}});
    const page = await context.newPage();
    await page.goto(baseURL);
    // Exercise the launcher so React hydration completes before modifying the DOM for the audit.
    await page.getByRole('button', {name:/Open adventure concierge/}).click();
    await page.getByRole('button', {name:'Close concierge',exact:true}).click();
    const tags = ['wcag2a','wcag2aa','wcag21aa'];
    const website = await new AxeBuilder({page}).withTags(tags).analyze();
    await page.getByRole('button', {name:/Open adventure concierge/}).click();
    const chat = await new AxeBuilder({page}).include('#concierge').withTags(tags).analyze();
    results.push({viewport: mobile?'mobile':'desktop',page:website.violations,chat:chat.violations});
    await context.close();
  }
} finally { await browser.close(); }
await mkdir('work',{recursive:true});
await writeFile('work/accessibility-report.json',JSON.stringify(results,null,2));
console.log(results.map(r=>({viewport:r.viewport,pageViolations:r.page.length,chatViolations:r.chat.length})));
if(results.some(r=>r.page.length||r.chat.length))process.exitCode=1;
