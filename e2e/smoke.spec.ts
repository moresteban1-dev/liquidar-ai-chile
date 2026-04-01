import { test, expect } from '@playwright/test';

/**
 * Smoke Test: Verifies critical application paths load without crashing.
 * This runs against the local dev server using real RSCs and database.
 */

test.describe('Platform Smoke Tests', () => {

    test('Homepage loads correctly', async ({ page }) => {
        await page.goto('/');

        // Expect the page title or major heading to be visible
        // Depending on the landing page, we check for generic layout structures
        await expect(page).toHaveTitle(/Dropservice|Plataforma/i);
        await expect(page.locator('body')).toBeVisible();
    });

    test('Auth redirection for protected routes', async ({ page }) => {
        await page.goto('/admin');

        // Admin route should redirect to /login
        await expect(page).toHaveURL(/.*\/login.*/);

        // The login page should have form fields
        await expect(page.getByRole('button', { name: /ingresar|iniciar|login/i })).toBeVisible({ timeout: 10000 });
    });

    test('Client quotation public link', async ({ page }) => {
        // Check an invalid or public route to ensure Custom 404 or generic fallback renders instead of 500 error
        const res = await page.goto('/client/quotation/invalid-uuid');

        // Might not be 404 if middleware catches it, but it should not hard-crash
        expect(res?.status()).toBeLessThan(500);
    });
});
