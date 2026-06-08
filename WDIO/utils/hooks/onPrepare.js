import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reportsDir = path.join(__dirname, '..', '..', 'reports', 'allure-results');
const screenshotsDir = path.join(__dirname, '..', '..', 'screenshots');

export async function onPrepare() {
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.mkdirSync(screenshotsDir, { recursive: true });
}
