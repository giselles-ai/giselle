import { expect, test } from "@playwright/test";

test.describe("Account settings navigation", () => {
	const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

	test("Navigate through account settings flow", async ({ page }) => {
		await page.goto(`${baseUrl}/apps`);

		await page.getByRole("button", { name: "Profile menu" }).click();
		await page
			.getByRole("menuitem", { name: "Account settings" })
			.waitFor({ state: "visible" });
		await page.getByRole("menuitem", { name: "Account settings" }).click();
		await expect(page).toHaveURL(`${baseUrl}/settings/account`, {
			timeout: 15000,
		});

		await page.getByRole("link", { name: "General settings" }).click();
		await expect(page).toHaveURL(`${baseUrl}/settings/account/general`, {
			timeout: 15000,
		});

		await page.getByRole("link", { name: "Authentication settings" }).click();
		await expect(page).toHaveURL(`${baseUrl}/settings/account/authentication`, {
			timeout: 15000,
		});

		await page.getByRole("link", { name: "Overview settings" }).click();
		await expect(page).toHaveURL(`${baseUrl}/settings/account`, {
			timeout: 15000,
		});
	});
});
