import BasePage from './BasePage.js';

class LoginPage extends BasePage {
  get emailInput() {
    return $('#userEmail');
  }

  get passwordInput() {
    return $('#userPassword');
  }

  get loginButton() {
    return $('#login');
  }

  get incorrectLoginMessage() {
    return $('div[aria-label="Incorrect email or password."]');
  }

  async getIncorrectLoginMessageText() {
    await this.incorrectLoginMessage.waitForDisplayed({
      timeout: 10000,
      timeoutMsg: 'Expected incorrect login message to be displayed'
    });
    return this.incorrectLoginMessage.getText();
  }

  async open() {
    await super.open('');
    await this.waitForPageReady();
    await this.emailInput.waitForDisplayed({
      timeout: 15000,
      timeoutMsg: 'Expected login page email field to be displayed'
    });
  }

  async login(username, password) {
    await this.emailInput.setValue(username);
    await this.passwordInput.setValue(password);
    await this.loginButton.click();
  }
}

export default new LoginPage();
