import { captureException } from "@sentry/nextjs";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, subscriptions, teams } from "@/drizzle";
import { getGiselleSession, updateGiselleSession } from "@/lib/giselle-session";
import { stripe } from "@/services/external/stripe";

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
	const records = await db
		.select({
			teamId: teams.id,
		})
		.from(subscriptions)
		.innerJoin(teams, eq(subscriptions.teamDbId, teams.dbId))
		.where(
			and(
				eq(subscriptions.status, "active"),
				eq(subscriptions.id, subscriptionId),
			),
		);
	if (records.length === 0) {
		throw new Error("Subscription not found");
	}
	return records[0].teamId;
}
