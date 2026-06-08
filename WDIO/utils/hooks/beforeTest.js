import allure from '@wdio/allure-reporter';

export async function beforeTest(test) {
  allure.addFeature(test.parent);

  if (test.title.includes('@smoke')) {
    allure.addSeverity('critical');
  } else if (test.title.includes('@regression')) {
    allure.addSeverity('normal');
  }

  if (test.title.includes('@api')) {
    allure.addLabel('layer', 'api');
  } else if (test.title.includes('@mobile')) {
    allure.addLabel('layer', 'mobile');
  } else {
    allure.addLabel('layer', 'ui');
  }
}
