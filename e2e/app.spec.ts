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

test('keeps the practice setup after navigating away', async ({ page }) => {
  await page.goto('/practice');
  await page.getByRole('button', { name: 'Снять выбор' }).click();
  await page.getByText('Урок 5 · Дорога и транспорт').click();
  await page.getByRole('button', { name: /Romaji → 日本語/ }).click();
  await page.getByLabel('Количество').selectOption('all');
  if ((page.viewportSize()?.width ?? 0) < 800) await page.getByRole('button', { name: 'Открыть меню' }).click();
  await page.getByRole('link', { name: 'Главная' }).click();
  if ((page.viewportSize()?.width ?? 0) < 800) await page.getByRole('button', { name: 'Открыть меню' }).click();
  await page.getByRole('link', { name: 'Тренировка' }).click();

  await expect(page.getByText('Урок 5 · Дорога и транспорт').locator('..').locator('..')).toHaveClass(/is-selected/);
  await expect(page.locator('.session-summary dd').first()).toHaveText('1');
  await expect(page.getByRole('button', { name: /Romaji → 日本語/ })).toHaveClass(/is-selected/);
  await expect(page.getByLabel('Количество')).toHaveValue('all');
});

test('offers only Russian and English interface languages', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.getByRole('button', { name: 'Русский' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'English' })).toBeVisible();
  await expect(page.getByRole('button', { name: '日本語' })).toHaveCount(0);
});

test('finishes a lesson through the in-app confirmation dialog', async ({ page }) => {
  await page.goto('/practice');
  await page.getByRole('button', { name: 'Начать сессию' }).click();
  await page.getByRole('button', { name: 'Завершить' }).click();
  await expect(page.getByRole('dialog', { name: 'Завершить сессию?' })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Завершить' }).click();
  await expect(page.getByText('Сессия завершена')).toBeVisible();
});
