import ClientAppApi from '../utils/api/ClientAppApi.js';
import LoginPage from '../pages/LoginPage.js';

export function registerCustomCommands() {
  browser.addCommand('login', async (username, password) => {
    await LoginPage.open();
    await LoginPage.login(username, password);
  });

  browser.addCommand('loginViaApi', async (username, password) => {
    const token = await ClientAppApi.login(username, password);

    await browser.url('');
    await browser.execute((authToken) => {
      window.localStorage.setItem('token', authToken);
    }, token);
    await browser.refresh();

    await browser.waitUntil(async () => (await $$('.card-body')).length > 0, {
      timeout: 15000,
      timeoutMsg: 'Expected dashboard products after API login'
    });
  });
}
