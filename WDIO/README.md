# WDIO UI Automation Framework

JavaScript UI automation framework using WebdriverIO v9, Mocha, page objects, test data fixtures, screenshots on failure, and Spec/Allure reporting.

## Structure

```text
WDIO/
  pages/            Page object classes
  test/data/        Test data fixtures
  test/specs/       Mocha specs
  utils/            Shared helpers
  reports/          Test report output
  screenshots/      Failure screenshots
  wdio.conf.js      WDIO runner configuration
```

## Setup

```bash
cd WDIO
npm install
```

## Run Tests

```bash
npm test
npm run test:headed
npm run test:smoke
npm run test:login
```

## Runtime Options

Environment variables can override the defaults:

```bash
BASE_URL=https://www.rahulshettyacademy.com/client HEADLESS=false npm test
BROWSER=chrome MAX_INSTANCES=1 npm test
```

WebdriverIO v9 manages browser drivers automatically, so this framework does not require a separate ChromeDriver service for normal local Chrome execution.
Downloaded driver binaries are cached in `WDIO/.wdio-cache`.
