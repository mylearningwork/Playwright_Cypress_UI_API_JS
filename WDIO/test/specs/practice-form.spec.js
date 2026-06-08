import {expect} from '@wdio/globals';
import PracticeFormPage from '../../pages/PracticeFormPage.js';
import student from '../data/practiceFormStudent.js';

describe('DemoQA Practice Form', () => {
    it('fills and submits the student registration form @smoke', async () => {
        await PracticeFormPage.open();
        await PracticeFormPage.fillForm(student);
        await PracticeFormPage.submit();

        await expect(PracticeFormPage.confirmationModal).toBeDisplayed();
        await expect(PracticeFormPage.confirmationTitle).toHaveText('Thanks for submitting the form');
        await expect(await PracticeFormPage.getSubmittedValue('Student Name')).toBe(`${student.firstName} ${student.lastName}`);
        await expect(await PracticeFormPage.getSubmittedValue('Student Email')).toBe(student.email);
        await expect(await PracticeFormPage.getSubmittedValue('Gender')).toBe(student.gender);
        await expect(await PracticeFormPage.getSubmittedValue('Mobile')).toBe(student.mobile);
        await expect(await PracticeFormPage.getSubmittedValue('Subjects')).toContain(student.subject);
        await expect(await PracticeFormPage.getSubmittedValue('Hobbies')).toContain(student.hobby);
        await expect(await PracticeFormPage.getSubmittedValue('Address')).toBe(student.currentAddress);
        await expect(await PracticeFormPage.getSubmittedValue('State and City')).toBe(`${student.state} ${student.city}`);
    });
});
