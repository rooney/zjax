import playwright from '@playwright/test';
import { dirname, resolve } from "path";
import { fileURLToPath } from 'url';
import { writeFileSync } from "fs";

const thisDir = dirname(fileURLToPath(import.meta.url));

export function withHtml(htmlBody, testBody) {
  return async function({page}, testInfo) {
    const htmlFile = resolve(thisDir, testInfo.title.replaceAll(' ', '-') + '.html');
    writeFileSync(htmlFile, `
      <html>
        <head>
          <link rel="stylesheet" href="https://cdn.simplecss.org/simple.min.css" />
          <script src="../dist/zjax.min.js"></script>
        </head>
        <body>
          <div>` + htmlBody + `</div>
        </body>
      </html>
    `, 'utf-8');

    await page.goto('file://' + htmlFile);
    await testBody(page, function(selector) {
      return playwright.expect(page.locator(selector));
    });
  };
}
