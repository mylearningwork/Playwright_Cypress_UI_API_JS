import BasePage from './BasePage.js';

class CartPage extends BasePage {
  get cartItems() {
    return $$('.cartSection h3');
  }

  get checkoutButton() {
    return $('=Checkout');
  }

  async goToCheckout() {
    await this.checkoutButton.waitForClickable();
    await this.checkoutButton.click();
  }

  async hasProduct(productName) {
    await browser.waitUntil(async () => (await this.cartItems).length > 0, {
      timeout: 15000,
      timeoutMsg: 'Expected cart items to be visible'
    });

    for (const item of await this.cartItems) {
      if ((await item.getText()).trim() === productName) {
        return true;
      }
    }

    return false;
  }
}

export default new CartPage();
