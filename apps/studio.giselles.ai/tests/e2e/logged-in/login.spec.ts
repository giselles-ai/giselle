import { expect, test } from "@playwright/test";

// E2E test for login session reuse
// Assumes storageState.json is used, so user is already logged in

test("Should be logged in and access Workspaces page", async ({ page }) => {
	const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
	// Go directly to the Workspaces page
	await page.goto(`${baseUrl}/workspaces`);
	// Assert navigation to the Workspaces page (user should be logged in)
	await expect(page).toHaveURL(`${baseUrl}/workspaces`, { timeout: 15000 });
	// Optionally, check for a UI element that only appears when logged in
});
