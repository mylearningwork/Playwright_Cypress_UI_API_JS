import BasePage from './BasePage.js';

class DashboardPage extends BasePage {
  get loginSuccessToast() {
    return $('div[aria-label="Login Successfully"]');
  }

  get productAddedToast() {
    return $('div[aria-label="Product Added To Cart"]');
  }

  get productCards() {
    return $$('.card-body');
  }

  get cartLink() {
    return $('[routerlink*="cart"]');
  }

  async addProductToCart(productName) {
    await browser.waitUntil(async () => (await this.productCards).length > 0, {
      timeout: 15000,
      timeoutMsg: 'Expected products to be visible on dashboard'
    });

    for (const productCard of await this.productCards) {
      const currentProductName = await productCard.$('b').getText();

      if (currentProductName.trim() === productName) {
        await productCard.$('button*=Add To Cart').click();
        return;
      }
    }

    throw new Error(`Product was not found on dashboard: ${productName}`);
  }

  async openCart() {
    await this.cartLink.click();
  }
}

export default new DashboardPage();
