import { createFlagsDiscoveryEndpoint, getProviderData } from "flags/next";
import * as flags from "../../../../flags";

export const runtime = "edge";
export const dynamic = "force-dynamic"; // defaults to auto

// This function handles the authorization check for you
export const GET = createFlagsDiscoveryEndpoint(async (_request) => {
	// Get provider data for feature flags
	const apiData = await getProviderData(flags);

	// Return the ApiData directly, without a NextResponse.json object
	return apiData;
});
