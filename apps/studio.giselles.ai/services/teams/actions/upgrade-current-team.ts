"use server";

import { redirect } from "next/navigation";
import invariant from "tiny-invariant";
import { fetchCurrentTeam, isProPlan } from "@/services/teams";
import type { TeamId } from "@/services/teams/types";
import { UPGRADING_TEAM_DB_ID_KEY } from "../constants";
import { createCheckoutSessionV2 } from "./create-checkout-session-v2";

export async function upgradeCurrentTeam(expectedTeamId: TeamId) {
	const team = await fetchCurrentTeam();
	invariant(
		team.id === expectedTeamId,
		"Team context changed. Please reload this page and try again.",
	);
	invariant(!isProPlan(team), "Only Free plan teams can upgrade");

	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
	invariant(siteUrl, "NEXT_PUBLIC_SITE_URL is not set");

	const successUrl = `${siteUrl}/settings/team`;
	const cancelUrl = successUrl;

	const subscriptionMetadata: Record<string, string> = {
		[UPGRADING_TEAM_DB_ID_KEY]: team.dbId.toString(),
	};

	const checkoutSession = await createCheckoutSessionV2(
		subscriptionMetadata,
		successUrl,
		cancelUrl,
	);
	redirect(checkoutSession.url);
}
