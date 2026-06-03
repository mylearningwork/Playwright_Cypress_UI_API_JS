export async function waitForDisplayed(element, timeout = 10000) {
  await element.waitForDisplayed({
    timeout,
    timeoutMsg: 'Expected element to be displayed'
  });
}

export async function waitForClickable(element, timeout = 10000) {
  await element.waitForClickable({
    timeout,
    timeoutMsg: 'Expected element to be clickable'
  });
}
