import { expect, test } from '@playwright/test';

test('starts a learning session and reveals English meaning', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Спокойный ритм/ })).toBeVisible();
  await page.getByRole('button', { name: /Начать 10 слов/ }).click();
  await expect(page.getByText(/Введите ромадзи|Выберите японское|Как это будет/)).toBeVisible();
});

test('editor remains usable on a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/editor');
  await expect(page.getByRole('heading', { name: 'Редактор материалов' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Добавить слово/ })).toBeVisible();
});
