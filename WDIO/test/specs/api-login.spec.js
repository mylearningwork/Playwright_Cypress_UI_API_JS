import { browser, expect } from '@wdio/globals';
import DashboardPage from '../../pages/DashboardPage.js';
import users from '../data/users.js';

describe('Client App API Login', () => {
  beforeEach(async () => {
    await browser.deleteCookies();
    await browser.url('');
    await browser.execute(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  it('skips UI login using API token @smoke @api', async () => {
    await browser.loginViaApi(users.validUser.email, users.validUser.password);

    await expect(DashboardPage.cartLink).toBeDisplayed();
    await expect(await DashboardPage.productCards).toBeElementsArrayOfSize({ gte: 1 });
  });
});
