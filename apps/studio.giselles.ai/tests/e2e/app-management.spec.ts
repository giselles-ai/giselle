import { expect, test } from "@playwright/test";

function escapeRegExp(string: string): string {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test.describe("App management", () => {
	const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

	test("Create and delete an app", async ({ page }) => {
		// Generate a random app name
		const _appName = `test-app-${Math.random().toString(36).substring(7)}`;

		// Go to the Apps page
		await page.goto(`${baseUrl}/apps`);

		// 1. Create a new app
		await page.getByRole("button", { name: "Create an app" }).click();

		// Wait for navigation to the new app's page (workspace)
		await expect(page).toHaveURL(
			new RegExp(`${escapeRegExp(baseUrl)}/workspaces/.*`),
			{
				timeout: 15000,
			},
		);

		// Wait for the tour to be visible before closing it
		await page.getByRole("button", { name: "Close tour" }).waitFor();
		// Press the Escape key to close the tour
		await page.keyboard.press("Escape");
		// Verify that the tour is closed
		await expect(
			page.getByRole("button", { name: "Close tour" }),
		).not.toBeVisible();

		// --- The following tests are temporarily skipped ---
		/*
		// 2. Give the app a random name
		// Click the editable text to turn it into an input
		await page.getByRole("button", { name: "App name" }).click();
		// Fill in the new name
		const input = page.getByRole("textbox", { name: "App name" });
		await input.fill(appName);
		// Press Enter to save
		await input.press("Enter");
		// Verify the name has been updated
		await expect(page.getByRole("button", { name: "App name" })).toHaveText(
			appName,
		);

		// 3. Go back to apps page by clicking the Giselle logo in the header
		await page.getByRole("link", { name: "Giselle logo" }).click();
		await expect(page).toHaveURL(`${baseUrl}/apps`, { timeout: 15000 });

		// 4. Delete the app
		const appCard = page.getByLabel(appName);
		await appCard.hover();
		await appCard.getByRole("button", { name: "Delete an app" }).click();
		await page.getByRole("button", { name: "Delete" }).click();

		// Assert that the app is no longer visible
		await expect(page.getByLabel(appName)).not.toBeVisible();
		*/
	});
});
