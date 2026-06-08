import { browser, expect } from '@wdio/globals';
import LoginPage from '../../pages/LoginPage.js';
import DashboardPage from '../../pages/DashboardPage.js';
import users from '../data/users.js';

describe('Client App Login', () => {
  beforeEach(async () => {
    await browser.deleteCookies();
    await browser.url('');
    await browser.execute(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  it('logs in with valid credentials @smoke', async () => {
    await browser.login(users.validUser.email, users.validUser.password);

    await expect(DashboardPage.loginSuccessToast).toBeDisplayed();
    await expect(DashboardPage.loginSuccessToast).toHaveText('Login Successfully');
  });

  it('shows error for invalid credentials @regression', async () => {
    await LoginPage.open();
    await LoginPage.login(users.invalidUser.email, users.invalidUser.password);

    await expect(LoginPage.incorrectLoginMessage).toBeDisplayed();
    await expect(LoginPage.incorrectLoginMessage).toHaveText('Incorrect email or password.');
  });

  it('opens the login page', async () => {
    await LoginPage.open();

    await expect(LoginPage.emailInput).toBeDisplayed();
    await expect(LoginPage.passwordInput).toBeDisplayed();
    await expect(LoginPage.loginButton).toBeClickable();
  });
});
