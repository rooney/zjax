import { test, expect } from '@playwright/test';
import { withHtml } from './test-utils';

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
      <a href="moby.htm" z-swap="${event} p">Fetch Moby Dick</a>
      <p>This will be replaced by Zjax</p>
    `,
    expectMobyDickAfter(action),
  ));
}


for (const [event, action] of [
  ['@dblclick', _ => _.fetcher.dblclick()],
]) {
  test(`z-swap ${event}`, withHtml(
    `
      <button z-swap="${event} ./moby.htm p">Fetch Moby Dick</button>
      <p>This will be replaced by Zjax</p>
    `,
    expectMobyDickAfter(action),
  ));
}


test(`z-swap @submit.prevent`, withHtml(
  `
    <form z-swap="@submit.prevent ./moby.htm *->p">
      <input type="submit" value="Fetch Moby Dick"/>
    </form>
    <p>This will be replaced by Zjax</p>
  `,
  expectMobyDickAfter(_ => _.fetcher.click()),
));


test(`z-swap endpoint takes precedence over href`, withHtml(
  `
    <a href="https://httpbin.org/encoding/utf8" z-swap="@click.prevent ./moby.htm *->p">
      Fetch Moby Dick, not Unicode Demo
    </a>
    <p>This will be replaced by Zjax</p>
  `,
  expectMobyDickAfter(_ => _.fetcher.click()),
));
