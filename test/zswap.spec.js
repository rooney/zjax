import { test, expect } from '@playwright/test';
import { withHtml } from './base';

function expectMobyDickAfter(action) {
  return async (page) => {
    const fetcher = page.fetcher = page.getByText('Fetch Moby Dick');
    const placeholder = page.getByText('This will be replaced by Zjax');
    const mobyDick = page.getByText('Oh, Death, why canst thou not sometimes be timely?');

    await expect(fetcher).toBeVisible();
    await expect(placeholder).toBeVisible();
    await expect(mobyDick).not.toBeVisible();

    await action(page);

    await expect(fetcher).toBeVisible();
    await expect(placeholder).not.toBeVisible();
    await expect(mobyDick).toBeVisible();
  }
}


for (const [event, action] of [
  ['@click.prevent', _ => _.fetcher.click()],
  ['@auxclick', _ => _.fetcher.click({ button: 'middle' })],
  ['@contextmenu', _ => _.fetcher.click({ button: 'right' })],
  ['@mousemove', _ => _.fetcher.hover()],
  ['@mouseover', _ => _.fetcher.hover()],
  ['@mouseenter', _ => _.fetcher.hover()],
  ['@mouseup', async _ => _.fetcher.hover().then(() => _.mouse.up())],
  ['@mousedown', async _ => _.fetcher.hover().then(() => _.mouse.down())],
  ['@mouseout', async _ => _.fetcher.hover().then(() => _.mouse.move(0, 0))],
  ['@mouseleave', async _ => _.fetcher.hover().then(() => _.mouse.move(0, 0))],
]) {
  test(`z-swap ${event}`, withHtml(
    `
      <sup>${event}</sup><br>
      <a href="/test/assets/mobydick.html" z-swap="${event} p">Fetch Moby Dick</a>
      <p>This will be replaced by Zjax</p>
    `,
    expectMobyDickAfter(action)
  ));
}


test(`z-swap @dblclick`, withHtml(
  `
    <sup>@dblclick</sup><br>
    <button z-swap="@dblclick /test/assets/mobydick.html p">Fetch Moby Dick</button>
    <p>This will be replaced by Zjax</p>
  `,
  expectMobyDickAfter(_ => _.fetcher.dblclick())
));


test(`z-swap @mount`, withHtml(
  `
    <p z-swap="@mount /test/assets/mobydick.html p">
      This will automatically be replaced by Zjax
    </p>
  `,
  async (page) => {
    await expect(page.getByText('Oh, Death, why canst thou not sometimes be timely?')).toBeVisible();
  }
));


const startsWith = (prefix) => new RegExp(`^${prefix}`);
for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
  const msg = 'hello-zjax';
  test(`z-swap @submit method=${method}`, withHtml(
    `
      <form z-swap="@submit.prevent ${method} /echo pre">
        <input type="text" name="msg" value="${msg}"/>
        <input type="submit" value="Submit"/>
      </form>
      <pre>This will be replaced by Zjax</pre>
    `,
    async (page) => {
      const submitBtn = page.getByText('Submit');
      const placeholder = page.getByText('This will be replaced by Zjax');

      await expect(submitBtn).toBeVisible();
      await expect(placeholder).toBeVisible();

      await submitBtn.click();

      await expect(submitBtn).toBeVisible();
      await expect(placeholder).not.toBeVisible();

      const echo = await page.getByText(msg);
      await expect(echo).toBeVisible();
      await expect(echo).toHaveText(startsWith(method));
    }
  ));
}


test(`z-swap endpoint takes precedence over form action`, withHtml(
  `
    <form action="https://httpbin.org/encoding/utf8" z-swap="@submit.prevent /test/assets/mobydick.html p">
      <button type="submit">
        Fetch Moby Dick, not Unicode Demo
      </button>
    </form>
    <p>This will be replaced by Zjax</p>
  `,
  expectMobyDickAfter(_ => _.fetcher.click())
));


test(`z-swap endpoint takes precedence over href`, withHtml(
  `
    <a href="https://httpbin.org/encoding/utf8" z-swap="@click.prevent /test/assets/mobydick.html p">
      Fetch Moby Dick, not Unicode Demo
    </a>
    <p>This will be replaced by Zjax</p>
  `,
  expectMobyDickAfter(_ => _.fetcher.click())
));


test(`z-swap *->x`, withHtml(
  `
    <a href="/test/assets/mobydick.html" z-swap="@click.prevent *->p">Fetch Moby Dick</a>
    <p>This will be replaced by Zjax</p>
  `,
  async (page) => {
    const title = page.getByText('Herman Melville - Moby-Dick');
    await expect(title).not.toBeVisible();
    await expectMobyDickAfter(_ => _.fetcher.click())(page);
    await expect(title).toBeVisible();
  }
));


test(`z-swap with partial snippet`, withHtml(
  `
    <a href="/test/assets/moby-snip.html" z-swap="@click.prevent p">Fetch Moby Dick</a>
    <p>This will be replaced by Zjax</p>
  `,
  expectMobyDickAfter(_ => _.fetcher.click())
));


test(`z-swap with partial snippet, *->x`, withHtml(
  `
    <a href="/test/assets/moby-snip.html" z-swap="@click.prevent *->p">Fetch Moby Dick</a>
    <p>This will be replaced by Zjax</p>
  `,
  expectMobyDickAfter(_ => _.fetcher.click())
));


test(`zjax.transitions = false`, withHtml(
  `
    <script type="module">
      zjax.transitions = false;
    </script>
    <a href="/test/assets/mobydick.html" z-swap="@click.prevent p">Fetch Moby Dick</a>
    <p>This will be replaced by Zjax</p>
  `,
  expectMobyDickAfter(_ => _.fetcher.click())
));
