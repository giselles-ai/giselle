import { expect, test } from "@playwright/test";
import { escapeRegExp } from "../helpers/regex";

test.describe("Protected paths authentication", () => {
	const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

	// List of protected paths that require authentication
	const protectedPaths = [
		{ path: "/workspaces", description: "Workspaces page" },
		{ path: "/workspaces/123", description: "Specific workspace page" },
		{ path: "/settings", description: "Settings page" },
		{ path: "/settings/account", description: "Account settings page" },
		{ path: "/settings/team", description: "Team settings page" },
		{ path: "/stage", description: "Stage page" },
		{ path: "/stage/123", description: "Specific stage page" },
		{ path: "/connected", description: "Connected page" },
		{ path: "/github/installed", description: "GitHub installed page" },
	];

	// Test without authentication
	test.describe("Unauthenticated access", () => {
		test.use({ storageState: { cookies: [], origins: [] } });

		for (const { path, description } of protectedPaths) {
			test(`Should redirect unauthenticated user to login when accessing ${description}`, async ({
				page,
				context,
			}) => {
				// Clear any existing cookies to ensure unauthenticated state
				await context.clearCookies();

				// Try to access the protected path
				await page.goto(`${baseUrl}${path}`);

				// Should be redirected to login page with returnUrl parameter
				await expect(page).toHaveURL(
					new RegExp(`${escapeRegExp(baseUrl)}/login\\?returnUrl=`),
					{ timeout: 15000 },
				);

				// Verify the returnUrl parameter is correctly set
				const url = new URL(page.url());
				const returnUrl = url.searchParams.get("returnUrl");
				expect(returnUrl).toBe(path);
			});
		}
	});
});
