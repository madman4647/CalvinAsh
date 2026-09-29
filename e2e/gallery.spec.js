const { test, expect } = require('@playwright/test');

test('component gallery renders every base component and matches its screenshot baseline', async ({ page }) => {
  await page.goto('/gallery');
  await expect(page.getByRole('heading', { name: 'Calvin component gallery' })).toBeVisible();
  await expect(page.getByText('SUBMIT & LOCK MARKS')).toBeVisible();

  await expect(page).toHaveScreenshot('gallery.png', { fullPage: true, maxDiffPixelRatio: 0.02 });
});
