import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const platform = (process.env.MOBILE_PLATFORM || 'android').toLowerCase();
const isAndroid = platform === 'android';
const appiumHost = process.env.APPIUM_HOST || '127.0.0.1';
const appiumPort = Number(process.env.APPIUM_PORT || 4723);

const androidCapability = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:deviceName': process.env.ANDROID_DEVICE_NAME || 'Android Emulator',
  'appium:platformVersion': process.env.ANDROID_PLATFORM_VERSION || '15',
  'appium:app': process.env.ANDROID_APP_PATH || path.join(__dirname, 'apps', 'android', 'sample.apk'),
  'appium:autoGrantPermissions': true,
  'appium:newCommandTimeout': 240
};

const iosCapability = {
  platformName: 'iOS',
  'appium:automationName': 'XCUITest',
  'appium:deviceName': process.env.IOS_DEVICE_NAME || 'iPhone 16',
  'appium:platformVersion': process.env.IOS_PLATFORM_VERSION || '18.0',
  'appium:app': process.env.IOS_APP_PATH || path.join(__dirname, 'apps', 'ios', 'Sample.app'),
  'appium:newCommandTimeout': 240
};

export const config = {
  runner: 'local',
  hostname: appiumHost,
  port: appiumPort,
  path: '/',
  specs: ['./test/specs/mobile/**/*.spec.js'],
  maxInstances: 1,
  logLevel: process.env.WDIO_LOG_LEVEL || 'error',
  bail: 0,
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
  capabilities: [
    isAndroid ? androidCapability : iosCapability
  ],
  afterTest: async function (test, context, { passed }) {
    if (!passed) {
      const safeTitle = test.title.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
      await browser.saveScreenshot(path.join(__dirname, 'screenshots', `${platform}_${safeTitle}.png`));
    }
  }
};
