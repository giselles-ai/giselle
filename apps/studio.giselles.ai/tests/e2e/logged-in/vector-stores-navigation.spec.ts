import { expect, test } from "@playwright/test";

test.describe("Vector stores sidebar navigation", () => {
	const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

	test("navigates from GitHub tab to Document tab", async ({ page }) => {
		await page.goto(`${baseUrl}/settings/team/vector-stores`);

		await page.getByRole("link", { name: "Document vector stores" }).click();

		await expect(page).toHaveURL(
			`${baseUrl}/settings/team/vector-stores/document`,
			{
				timeout: 15000,
			},
		);
	});
});
