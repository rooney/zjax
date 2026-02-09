import { test } from '@playwright/test';
import { withHtml } from './test-utils';

test('z-swap on click', withHtml(
  `
    <a href="https://httpbin.org/html" z-swap="@click.prevent p">Fetch Moby Dick</a>
    <p>This will be replaced by Zjax.</p>
  `,
  async (page, expect) => {
    await expect("text=Fetch Moby Dick").toBeVisible();
    await expect("text=This will be replaced by Zjax").toBeVisible();
    await expect("text=Availing himself of the mild").not.toBeVisible();

    await page.click("text=Fetch Moby Dick");

    await expect("text=Fetch Moby Dick").toBeVisible();
    await expect("text=This will be replaced by Zjax").not.toBeVisible();
    await expect("text=Availing himself of the mild").toBeVisible();
  }
));
