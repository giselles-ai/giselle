import { expect, test } from "@playwright/test";

// E2E test for login
test("Login", async ({ page }) => {
	// Use environment variables for configuration
	const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
	const loginEmail = process.env.PLAYWRIGHT_LOGIN_EMAIL;
	const loginPassword = process.env.PLAYWRIGHT_LOGIN_PASSWORD;

	// Navigate to login page
	await page.goto(`${baseUrl}/login`);

	// Fill in email
	await page.getByRole("textbox", { name: "Email" }).fill(loginEmail);

	// Fill in password
	await page.getByRole("textbox", { name: "Password" }).fill(loginPassword);

	// Click login button
	await page.getByRole("button", { name: "Log in" }).click();

	// Assert navigation to the Apps page
	await expect(page).toHaveURL(`${baseUrl}/apps`);
});
