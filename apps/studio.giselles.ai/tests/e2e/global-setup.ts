import { chromium } from "@playwright/test";
import { navigateToLoginPage, performLogin } from "./helpers/login";

async function globalSetup() {
	const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

	const browser = await chromium.launch();
	try {
		const page = await browser.newPage();

		await navigateToLoginPage(page, baseUrl);
		await performLogin(page, `${baseUrl}/workspaces`);

		// Save storage state
		const storagePath = "./tests/e2e/.auth/storageState.json";
		await page.context().storageState({ path: storagePath });
	} finally {
		await browser.close();
	}
}

export default globalSetup;
