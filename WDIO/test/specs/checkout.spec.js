import { browser, expect } from '@wdio/globals';
import DashboardPage from '../../pages/DashboardPage.js';
import CartPage from '../../pages/CartPage.js';
import CheckoutPage from '../../pages/CheckoutPage.js';
import OrderPage from '../../pages/OrderPage.js';
import users from '../data/users.js';
import products from '../data/products.js';
import checkoutData from '../data/checkout.js';

describe('Client App Checkout', () => {
  it('completes checkout and verifies order in history @smoke @regression', async () => {
    await browser.login(users.validUser.email, users.validUser.password);

    await DashboardPage.addProductToCart(products.zaraCoat);
    await expect(DashboardPage.productAddedToast).toBeDisplayed();

    await DashboardPage.openCart();
    await expect(await CartPage.hasProduct(products.zaraCoat)).toBe(true);

    await CartPage.goToCheckout();
    await CheckoutPage.emailInput.waitForDisplayed();
    await expect(CheckoutPage.emailInput).toHaveText(users.validUser.email);

    await CheckoutPage.selectCountry(checkoutData.countrySearch, checkoutData.countryName);
    await CheckoutPage.placeOrder();

    await expect(OrderPage.orderPlacedMessage).toBeDisplayed();
    await expect(OrderPage.orderPlacedMessage).toHaveText(expect.stringMatching(/thankyou for the order\./i));

    const orderId = await OrderPage.getOrderId();
    expect(orderId.length).toBeGreaterThan(0);

    await OrderPage.openOrderHistory();
    await OrderPage.openOrderDetails(orderId);

    const summaryOrderId = await OrderPage.getOrderSummaryId();
    expect(orderId).toContain(summaryOrderId);
  });
});
