import { test, expect } from '@playwright/test';

test('has title and loads successfully', async ({ page }) => {
  await page.goto('/');

  // Expect title to contain the store name
  await expect(page).toHaveTitle(/BEAUTY GLOWRY/);
});
