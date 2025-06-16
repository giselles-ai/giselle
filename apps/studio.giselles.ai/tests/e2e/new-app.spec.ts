import { expect, test } from "@playwright/test";
import { escapeRegExp } from "./utils";

// E2E test for New App creation
// Assumes storageState.json is used, so user is already logged in

test("Should create a new app and navigate to workspace page", async ({
	page,
}) => {
	const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
	const baseUrlPattern = escapeRegExp(baseUrl);
	// Go directly to the Apps page
	await page.goto(`${baseUrl}/apps`);
	await expect(page).toHaveURL(`${baseUrl}/apps`, { timeout: 15000 });

	// Click the 'New App +' button and wait for navigation
	await Promise.all([
		page.waitForURL(new RegExp(`${baseUrlPattern}/workspaces/[^/]+`), {
			timeout: 15000,
		}),
		page.getByRole("button", { name: /new app \+/i }).click(),
	]);

	// Assert navigation to workspace page by checking URL and a unique element
	await expect(page).toHaveURL(
		new RegExp(`${baseUrlPattern}/workspaces/[^/]+`),
		{
			timeout: 15000,
		},
	);
});
