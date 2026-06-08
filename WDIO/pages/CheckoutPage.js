import BasePage from './BasePage.js';

class CheckoutPage extends BasePage {
  get emailInput() {
    return $('.user__name [type="text"]');
  }

  get placeOrderButton() {
    return $('.action__submit');
  }

  get countryInput() {
    return $('[placeholder="Select Country"]');
  }

  get countryResults() {
    return $('.ta-results');
  }

  async selectCountry(searchText, countryName) {
    await this.countryInput.click();

    for (const character of searchText) {
      await this.countryInput.addValue(character);
      await browser.pause(300);
    }

    await browser.waitUntil(async () => (await this.countryResults.$$('button')).length > 0, {
      timeout: 10000,
      timeoutMsg: 'Expected country search results to appear'
    });

    for (const option of await this.countryResults.$$('button')) {
      if ((await option.getText()).trim() === countryName) {
        await option.click();
        return;
      }
    }

    throw new Error(`Country was not found: ${countryName}`);
  }

  async placeOrder() {
    await this.placeOrderButton.scrollIntoView();
    await this.placeOrderButton.waitForClickable();
    await this.placeOrderButton.click();
  }
}

export default new CheckoutPage();
