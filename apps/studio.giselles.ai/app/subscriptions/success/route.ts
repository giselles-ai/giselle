import { captureException } from "@sentry/nextjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, teams } from "@/db";
import { getGiselleSession, updateGiselleSession } from "@/lib/giselle-session";
import { stripe } from "@/services/external/stripe";
import { getLatestSubscriptionV2 } from "@/services/subscriptions/get-latest-subscription-v2";

export async function GET(_request: Request) {
	const session = await getGiselleSession();
	const checkoutSessionId = session?.checkoutSessionId;
	if (checkoutSessionId == null) {
		// no checkout session id, redirect to /settings/team
		redirect("/settings/team");
	}

	try {
		const checkoutSession =
			await stripe.checkout.sessions.retrieve(checkoutSessionId);
		const subscription = checkoutSession.subscription;
		if (subscription == null) {
			throw new Error("Subscription not found");
		}

		const subscriptionId =
			typeof subscription === "string" ? subscription : subscription.id;
		const teamId = await getTeamIdFromSubscription(subscriptionId);
		await updateGiselleSession({ teamId, checkoutSessionId: undefined });
		redirect("/settings/team");
	} catch (error) {
		// fallback
		captureException(error);
		redirect("/settings/team");
	}
}

async function getTeamIdFromSubscription(subscriptionId: string) {
	const result = await getLatestSubscriptionV2(subscriptionId);
	if (!result) {
		throw new Error("Subscription not found");
	}
	if (result.subscription.servicingStatus !== "active") {
		throw new Error("Subscription is not active");
	}
	const [team] = await db
		.select({
			teamId: teams.id,
		})
		.from(teams)
		.where(eq(teams.dbId, result.subscription.teamDbId));
	if (!team) {
		throw new Error("Team not found");
	}
	return team.teamId;
}
