import { readdirSync, writeFileSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import path from 'node:path';

import chalk from 'chalk';
import { addCoverageReport } from 'monocart-reporter';
import slugify from '@sindresorhus/slugify';

const testsDir = import.meta.dirname;

export function withHtml(htmlBody, testBody) {
  return async function ({ page }, testInfo) {
    const htmlFile = `${slugify(testInfo.title)}.html`;
    const url = `http://localhost:3000/tests/${htmlFile}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="https://cdn.simplecss.org/simple.min.css"/>
          <script type="module" src="../src/main.js"></script>
        </head>
        <body>
          <main>${htmlBody}</main>
          <script src="use-npm-dev.js"></script>
        </body>
      </html>
    `;
    writeFileSync(path.join(testsDir, htmlFile), htmlContent, 'utf-8');
    await runTest(page, url, testBody, testInfo);
  };
}

async function runTest(page, url, testBody, testInfo) {
  await page.coverage.startJSCoverage();
  await page.goto(url);
  await testBody(page);
  const coverageData = await page.coverage.stopJSCoverage();
  await addCoverageReport(coverageData, testInfo);
}

export default class UsageHelper {
  onBegin(_, testSuite) {
    this.testSuite = testSuite;
  }

  onEnd() {
    console.log('Coverage Report is under the top-right burger menu');
    const testedHtmls = new Set(this.testSuite.allTests().map(test => slugify(test.title) + '.html'));
    const htmlFiles = readdirSync(testsDir).filter(file => file.endsWith('.html'));
    for (const filename of htmlFiles) {
      const isUnused = !testedHtmls.has(filename);
      if (isUnused) {
        console.log(chalk.yellow(`[Unused] Deleting tests/${filename}`));
        unlink(path.join(testsDir, filename));
      }
    }
  }

  onTestEnd(test, result) {
    if (result.status !== 'passed') {
      console.error('  ⚠️  ', chalk.bgRed(`tests/${slugify(test.title)}.html`));
    }
  }
}
