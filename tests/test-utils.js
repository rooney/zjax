import { expect } from '@playwright/test';
import { join } from 'path';
import { writeFile } from 'fs/promises';

const projectRoot = process.cwd();
const testsDir = join(projectRoot, 'tests');
const coverageOutputDir = join(projectRoot, 'coverage/output');

export function withHtml(htmlBody, testBody) {
  return async function ({ page }, testInfo) {
    const titleSlug = testInfo.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const htmlFile = join(testsDir, `${titleSlug}.html`);
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="https://cdn.simplecss.org/simple.min.css" />
          <script src="../dist/zjax.coverage.js"></script>
        </head>
        <body>
          <div> ${htmlBody} </div>
        </body>
      </html>
    `;
    await writeFile(htmlFile, htmlContent, 'utf-8');
    await writeFile(
      join(coverageOutputDir, `${testInfo.testId}.json`),
      JSON.stringify(await gatherCoverageData(htmlFile, page, testBody)),
      'utf-8',
    );
  };
}

async function gatherCoverageData(htmlFile, page, testBody) {
  await page.coverage.startJSCoverage({ resetOnNavigation: false });
  try {
    await page.goto(`file://${htmlFile}`);
    await testBody(page, (selector) => expect(page.locator(selector)));
  } finally {
    return await page.coverage.stopJSCoverage();
  }
}
