import { test, expect } from '@playwright/test';

test('CV Builder loads and has upload picture button', async ({ page }) => {
    // Navigate to the CV builder page
    await page.goto('http://localhost:5173/my-cv');

    // Check if the Profile Tab is active
    await expect(page.locator('button', { hasText: 'Profile' })).toBeVisible();

    // Look for the file input label
    await expect(page.locator('label', { hasText: 'Profile Picture' })).toBeVisible();

    // Look for the actual file input element
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
});
