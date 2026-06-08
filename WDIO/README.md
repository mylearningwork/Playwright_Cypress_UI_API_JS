# WDIO UI Automation Framework

JavaScript UI automation framework using WebdriverIO v9, Mocha, page objects, test data fixtures, API-assisted login, screenshots on failure, and Spec/Allure reporting.

## Structure

```text
WDIO/
  pages/              Page object classes
  test/data/          Test data fixtures
  test/specs/         Mocha specs for UI and API tests
  test/specs/api/       Standalone API tests
  test/specs/mobile/    Mobile specs (Appium config only)
  utils/api/            API clients and service wrappers
  utils/hooks/          onPrepare, beforeTest, afterTest hooks
  utils/                Shared helpers and custom WDIO commands
  reports/              Test report output
  screenshots/          Failure screenshots
  wdio.conf.js          Web runner configuration
  wdio.mobile.conf.js   Mobile Appium runner configuration
```

## Setup

```bash
cd WDIO
npm install
cp .env.example .env
```

Update `.env` with your credentials. Credentials are never committed — they load from environment variables at runtime.

## Run Tests

```bash
npm test                  # Full web suite (mobile excluded)
npm run test:headed       # Run with visible browser
npm run test:smoke        # @smoke tagged tests only
npm run test:login        # Login specs
npm run test:checkout     # End-to-end checkout flow
npm run test:api          # Petstore API specs
npm run test:api-login    # API token login + UI verification
npm run test:practice-form
npm run test:mobile:android
npm run test:mobile:ios
```

## Allure Reports

```bash
npm test
npm run allure:generate
npm run allure:open
```

Failure screenshots are attached to Allure automatically via the `afterTest` hook.

## Runtime Options

Environment variables can override the defaults:

```bash
BASE_URL=https://www.rahulshettyacademy.com/client HEADLESS=false npm test
BROWSER=chrome MAX_INSTANCES=1 npm test
USER_EMAIL=you@example.com USER_PASSWORD=secret npm run test:login
PETSTORE_API_URL=https://petstore.swagger.io/v2 npm run test:api
ANDROID_APP_PATH=/absolute/path/app.apk npm run test:mobile:android
IOS_APP_PATH=/absolute/path/Sample.app npm run test:mobile:ios
```

## Mobile Tests

Mobile automation uses a separate Appium config: `wdio.mobile.conf.js`.
Mobile specs are excluded from the default web runner.

- Android: `UiAutomator2`
- iOS: `XCUITest`

Before running mobile tests, install Appium drivers and start Appium:

```bash
npx appium driver install uiautomator2
npx appium driver install xcuitest
npx appium
```

Then run one platform:

```bash
ANDROID_APP_PATH=/path/to/app.apk npm run test:mobile:android
IOS_APP_PATH=/path/to/app.app npm run test:mobile:ios
```

## API Tests

API tests live under `test/specs/api` and use lightweight service clients under `utils/api`.
The framework uses Node's built-in `fetch` API, so no extra HTTP client dependency is required.
Petstore coverage includes POST create pet, GET pet by id, and GET with query parameters.

## API-Assisted Login

UI login is slow for cart and checkout flows. The framework supports token injection via API:

```js
await browser.loginViaApi(email, password);
```

This calls `ClientAppApi`, stores the token in `localStorage`, and waits for the dashboard to load.

## Custom Commands

The framework registers reusable commands in `utils/customCommands.js`:

```js
await browser.login(email, password);
await browser.loginViaApi(email, password);
```

## CI

GitHub Actions runs smoke tests on push/PR when `WDIO/` changes.
See `.github/workflows/wdio-ci.yml`.

## Retries

Spec file retries are enabled in `wdio.conf.js`:

```js
specFileRetries: Number(process.env.SPEC_FILE_RETRIES || 2)
```

WebdriverIO v9 manages browser drivers automatically, so this framework does not require a separate ChromeDriver service for normal local Chrome execution.
Downloaded driver binaries are cached in `WDIO/.wdio-cache`.
