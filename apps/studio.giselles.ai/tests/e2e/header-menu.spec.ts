import { expect, test } from "@playwright/test";

// E2E test for header menu navigation after login
// Assumes storageState.json is used, so user is already logged in

test.describe("Header menu navigation", () => {
	const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

	const menuTests = [
		{
			label: "Members menu",
			url: "/settings/team/members",
		},
		{
			label: "Integrations menu",
			url: "/settings/team/integrations",
		},
		{
			label: "Usage menu",
			url: "/settings/team/usage",
		},
		{
			label: "Team Settings menu",
			url: "/settings/team",
		},
	];

	for (const { label, url } of menuTests) {
		test(`Clicking ${label} navigates to ${url}`, async ({ page }) => {
			// Go to the Apps page (assume logged in)
			await page.goto(`${baseUrl}/apps`);
			// Click the header menu item by aria-label
			await page.getByRole("link", { name: label }).click();
			// Assert navigation to the correct page
			await expect(page).toHaveURL(`${baseUrl}${url}`, { timeout: 15000 });
		});
	}
});
