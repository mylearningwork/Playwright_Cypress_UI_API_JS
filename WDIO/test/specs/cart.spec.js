import { expect } from '@wdio/globals';
import LoginPage from '../../pages/LoginPage.js';
import DashboardPage from '../../pages/DashboardPage.js';
import CartPage from '../../pages/CartPage.js';
import users from '../data/users.js';
import products from '../data/products.js';

describe('Client App Cart', () => {
  it('adds a product to the cart @smoke', async () => {
    await LoginPage.open();
    await LoginPage.login(users.validUser.email, users.validUser.password);

    await DashboardPage.addProductToCart(products.zaraCoat);
    await expect(DashboardPage.productAddedToast).toBeDisplayed();

    await DashboardPage.openCart();
    await expect(await CartPage.hasProduct(products.zaraCoat)).toBe(true);
  });
});

describe("opengoogle chrome",()=>{

  it("it opens search page",()=>{

    browser.url("https://google.com")

  })


})
