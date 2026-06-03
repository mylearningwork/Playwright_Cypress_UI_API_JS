import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.env.WEBDRIVER_CACHE_DIR = process.env.WEBDRIVER_CACHE_DIR || path.join(__dirname, '.wdio-cache');

const headless = process.env.HEADLESS !== 'false';
const baseUrl = process.env.BASE_URL || 'https://www.rahulshettyacademy.com/client';

export const config = {
  runner: 'local',
  specs: ['./test/specs/**/*.spec.js'],
  exclude: [],
  maxInstances: Number(process.env.MAX_INSTANCES || 2),
  logLevel: process.env.WDIO_LOG_LEVEL || 'error',
  bail: 0,
  baseUrl,
  waitforTimeout: Number(process.env.WAIT_TIMEOUT || 10000),
  connectionRetryTimeout: Number(process.env.CONNECTION_RETRY_TIMEOUT || 120000),
  connectionRetryCount: Number(process.env.CONNECTION_RETRY_COUNT || 2),
  framework: 'mocha',
  reporters: [
    'spec',
    ['allure', {
      outputDir: path.join(__dirname, 'reports', 'allure-results'),
      disableWebdriverStepsReporting: false,
      disableWebdriverScreenshotsReporting: false
    }]
  ],
  mochaOpts: {
    ui: 'bdd',
    timeout: Number(process.env.MOCHA_TIMEOUT || 60000)
  },
  capabilities: [{
    browserName: process.env.BROWSER || 'chrome',
    acceptInsecureCerts: true,
    'wdio:chromedriverOptions': {
      cacheDir: process.env.WEBDRIVER_CACHE_DIR || path.join(__dirname, '.wdio-cache')
    },
    'goog:chromeOptions': {
      args: [
        ...(headless ? ['--headless=new'] : []),
        '--disable-gpu',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--window-size=1440,900'
      ]
    }
  }],
  before: async function () {
    await browser.setWindowSize(1440, 900);
  },
  afterTest: async function (test, context, { passed }) {
    if (!passed) {
      const safeTitle = test.title.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
      await browser.saveScreenshot(path.join(__dirname, 'screenshots', `${safeTitle}.png`));
    }
  }
};
