export function isValidReturnUrl(
	returnUrl: FormDataEntryValue | null | undefined,
): returnUrl is string {
	return (
		returnUrl != null &&
		typeof returnUrl === "string" &&
		returnUrl.startsWith("/") &&
		!returnUrl.startsWith("//") &&
		!returnUrl.startsWith("/\\") // Also block /\evil.com
	);
}
