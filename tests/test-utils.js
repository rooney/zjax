import { writeFile } from 'fs/promises';
import path from 'path';
import { expect, test } from '@playwright/test';
import slugify from '@sindresorhus/slugify';

const projectRoot = process.cwd();
const testsDir = path.join(projectRoot, 'tests');
const nycOutputDir = path.join(projectRoot, '.nyc_output');

export function withHtml(htmlBody, testBody) {
  return async function ({ page }, testInfo) {
    const htmlFile = path.join(testsDir, `${slugify(testInfo.title)}.html`);
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="https://cdn.simplecss.org/simple.min.css" />
          <script src="../dist/zjax.debug.js"></script>
        </head>
        <body>
          <div> ${htmlBody} </div>
        </body>
      </html>
    `;
    await writeFile(htmlFile, htmlContent, 'utf-8');
    await page.goto(`file://${htmlFile}`);
    await testBody(page, (selector) => expect(page.locator(selector)));
  };
}

test.afterEach(async ({ page }, testInfo) => {
  const filename = path.join(nycOutputDir, `${testInfo.testId}.json`);
  const coverageData = await page.evaluate(() => globalThis.__coverage__);
  await writeFile(filename, JSON.stringify(coverageData), 'utf-8');
});
