import { test, expect } from '@playwright/test';
import { withHtml } from './base';

test(`zjax.debug = true`, withHtml(
  `
    <script type="module">
      zjax.debug = true;
    </script>
  `,
  async (page) => {
    expect(page.logs.every(msg => msg.startsWith('ZJAX DEBUG:'))).toBeTruthy();
  }
));
