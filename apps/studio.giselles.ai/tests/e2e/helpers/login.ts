import type { Page } from "@playwright/test";

export async function performLogin(
	page: Page,
	expectedRedirectUrl?: string,
): Promise<void> {
	const loginEmail = process.env.PLAYWRIGHT_LOGIN_EMAIL;
	const loginPassword = process.env.PLAYWRIGHT_LOGIN_PASSWORD;

	if (!loginEmail || !loginPassword) {
		throw new Error(
			"PLAYWRIGHT_LOGIN_EMAIL and PLAYWRIGHT_LOGIN_PASSWORD must be set in environment variables.",
		);
	}

	await page.getByRole("textbox", { name: "Email" }).fill(loginEmail);
	await page.getByRole("textbox", { name: "Password" }).fill(loginPassword);

	// Click login and wait for redirect if expectedRedirectUrl is provided
	if (expectedRedirectUrl) {
		await Promise.all([
			page.waitForURL(expectedRedirectUrl, { timeout: 15000 }),
			page.getByRole("button", { name: "Log in" }).click(),
		]);
	} else {
		await page.getByRole("button", { name: "Log in" }).click();
	}
}
