import { browser, expect } from '@wdio/globals';

describe('Mobile App Smoke', () => {
  it('starts the mobile app session @mobile @smoke', async () => {
    const contexts = await browser.getContexts();

    await expect(contexts.length).toBeGreaterThan(0);
  });
});
