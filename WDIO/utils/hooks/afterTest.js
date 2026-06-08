import path from 'node:path';
import { fileURLToPath } from 'node:url';
import allure from '@wdio/allure-reporter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function afterTest(test, _context, { passed, error }) {
  if (passed) {
    return;
  }

  const safeTitle = test.title.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
  const screenshotPath = path.join(__dirname, '..', '..', 'screenshots', `${safeTitle}.png`);
  const screenshot = await browser.takeScreenshot();

  await browser.saveScreenshot(screenshotPath);
  allure.addAttachment('Screenshot', Buffer.from(screenshot, 'base64'), 'image/png');

  if (error?.message) {
    allure.addAttachment('Error', error.message, 'text/plain');
  }
}
