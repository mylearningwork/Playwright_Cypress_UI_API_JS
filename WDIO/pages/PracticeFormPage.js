import BasePage from './BasePage.js';

class PracticeFormPage extends BasePage {
  get firstNameInput() {
    return $('#firstName');
  }

  get lastNameInput() {
    return $('#lastName');
  }

  get emailInput() {
    return $('#userEmail');
  }

  get mobileInput() {
    return $('#userNumber');
  }

  get dateOfBirthInput() {
    return $('#dateOfBirthInput');
  }

  get subjectsInput() {
    return $('#subjectsInput');
  }

  get currentAddressInput() {
    return $('#currentAddress');
  }

  get stateDropdown() {
    return $('#state');
  }

  get cityDropdown() {
    return $('#city');
  }

  get submitButton() {
    return $('#submit');
  }

  get confirmationModal() {
    return $('.modal-content');
  }

  get confirmationTitle() {
    return $('#example-modal-sizes-title-lg');
  }

  async open() {
    await super.open('https://demoqa.com/automation-practice-form');
    await this.hideAds();
    await this.firstNameInput.waitForDisplayed({
      timeout: 15000,
      timeoutMsg: 'Expected practice form to be displayed'
    });
  }

  async hideAds() {
    await browser.execute(() => {
      const selectors = ['#fixedban', 'footer', 'iframe[id^="google_ads"]'];
      selectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((element) => element.remove());
      });
    });
  }

  async selectGender(gender) {
    await this.clickLabelByText(gender);
  }

  async selectHobby(hobby) {
    await this.clickLabelByText(hobby);
  }

  async setDateOfBirth(dateOfBirth) {
    await browser.execute((value) => {
      const dateInput = document.querySelector('#dateOfBirthInput');
      dateInput.value = value;
      dateInput.dispatchEvent(new Event('input', { bubbles: true }));
      dateInput.dispatchEvent(new Event('change', { bubbles: true }));
    }, dateOfBirth);
  }

  async setSubject(subject) {
    await this.subjectsInput.setValue(subject);
    const option = await $(`div=${subject}`);
    await option.waitForDisplayed();
    await option.click();
  }

  async selectState(state) {
    await this.stateDropdown.scrollIntoView();
    await this.stateDropdown.click();
    await $(`div=${state}`).click();
  }

  async selectCity(city) {
    await this.cityDropdown.click();
    await $(`div=${city}`).click();
  }

  async fillForm(student) {
    await this.firstNameInput.setValue(student.firstName);
    await this.lastNameInput.setValue(student.lastName);
    await this.emailInput.setValue(student.email);
    await this.selectGender(student.gender);
    await this.mobileInput.setValue(student.mobile);
    await this.setDateOfBirth(student.dateOfBirth);
    await this.setSubject(student.subject);
    await this.selectHobby(student.hobby);
    await this.currentAddressInput.setValue(student.currentAddress);
    await this.selectState(student.state);
    await this.selectCity(student.city);
  }

  async submit() {
    await this.submitButton.scrollIntoView();
    await this.submitButton.click();
  }

  async getSubmittedValue(label) {
    const row = await $(`//td[text()="${label}"]/following-sibling::td`);
    await row.waitForDisplayed();
    return row.getText();
  }

  async clickLabelByText(text) {
    const label = await $(`label=${text}`);
    await label.scrollIntoView();
    await label.click();
  }
}

export default new PracticeFormPage();
