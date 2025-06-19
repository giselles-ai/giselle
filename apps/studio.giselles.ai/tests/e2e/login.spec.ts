import { expect, test } from "@playwright/test";

// E2E test for login session reuse
// Assumes storageState.json is used, so user is already logged in

test("Should be logged in and access Apps page", async ({ page }) => {
	const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
	// Go directly to the Apps page
	await page.goto(`${baseUrl}/apps`);
	// Assert navigation to the Apps page (user should be logged in)
	await expect(page).toHaveURL(`${baseUrl}/apps`, { timeout: 15000 });
	// Optionally, check for a UI element that only appears when logged in
});
