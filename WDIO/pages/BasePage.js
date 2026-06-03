export default class BasePage {
  async open(path = '') {
    await browser.url(path);
  }

  async waitForPageReady() {
    await browser.waitUntil(
      async () => await browser.execute(() => document.readyState) === 'complete',
      {
        timeout: 10000,
        timeoutMsg: 'Expected document readyState to be complete'
      }
    );
  }
}
