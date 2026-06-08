import BasePage from './BasePage.js';

class OrderPage extends BasePage {
  get orderPlacedMessage() {
    return $('h1.hero-primary');
  }

  get orderIdText() {
    return $('.em-spacer-1 .ng-star-inserted');
  }

  get ordersTab() {
    return $('button[routerlink*="myorders"]');
  }

  get orderRows() {
    return $$('tbody tr');
  }

  get orderSummaryId() {
    return $('.col-text');
  }

  async getOrderId() {
    await this.orderIdText.waitForDisplayed();
    return (await this.orderIdText.getText()).trim();
  }

  async openOrderHistory() {
    await this.ordersTab.click();
    await browser.waitUntil(async () => (await this.orderRows).length > 0, {
      timeout: 15000,
      timeoutMsg: 'Expected order history rows to be visible'
    });
  }

  async openOrderDetails(orderId) {
    for (const row of await this.orderRows) {
      const rowOrderId = (await row.$('th').getText()).trim();

      if (orderId.includes(rowOrderId)) {
        await row.$('button').click();
        return;
      }
    }

    throw new Error(`Order was not found in history: ${orderId}`);
  }

  async getOrderSummaryId() {
    await this.orderSummaryId.waitForDisplayed();
    return (await this.orderSummaryId.getText()).trim();
  }
}

export default new OrderPage();
