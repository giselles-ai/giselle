import { chromium } from "@playwright/test";

async function globalSetup() {
	const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
	const loginEmail = process.env.PLAYWRIGHT_LOGIN_EMAIL;
	const loginPassword = process.env.PLAYWRIGHT_LOGIN_PASSWORD;

	if (!loginEmail || !loginPassword) {
		throw new Error(
			"PLAYWRIGHT_LOGIN_EMAIL and PLAYWRIGHT_LOGIN_PASSWORD must be set in environment variables.",
		);
	}

	const browser = await chromium.launch();
	try {
		const page = await browser.newPage();

		await page.goto(`${baseUrl}/login`);
		await page.getByRole("textbox", { name: "Email" }).fill(loginEmail);
		await page.getByRole("textbox", { name: "Password" }).fill(loginPassword);
		await Promise.all([
			page.waitForURL(`${baseUrl}/apps`, { timeout: 15000 }),
			page.getByRole("button", { name: "Log in" }).click(),
		]);

		// Save storage state
		const storagePath = "./tests/e2e/.auth/storageState.json";
		await page.context().storageState({ path: storagePath });
	} finally {
		await browser.close();
	}
}

export default globalSetup;
