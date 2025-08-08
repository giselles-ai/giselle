import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import {
	db,
	subscriptions,
	teamMemberships,
	userSeatUsageReports,
} from "@/drizzle";
import { stripe } from "../external/stripe";

const USER_SEAT_METER_NAME = "user_seat_v2";

/**
 * Reports user seat usage to Stripe's metering system for usage-based billing.
 * Uses Stripe's "last" aggregation formula to directly report the current member count.
 *
 * @param subscriptionId - The Stripe subscription ID to report usage for
 * @param customerId - The Stripe customer ID associated with the subscription
 * @throws {Error} When the subscription is not found
 * @returns {Promise<void>} A promise that resolves when the usage has been reported
 */
export async function reportUserSeatUsage(
	subscriptionId: string,
	customerId: string,
): Promise<void> {
	const teamDbId = await findTeamDbId(subscriptionId);
	const teamMembers = await listTeamMembers(teamDbId);
	const currentMemberCount = teamMembers.length;

	const stripeEvent = await reportToStripe(customerId, currentMemberCount);

	await saveUserSeatUsage({
		stripeMeterEventId: stripeEvent.identifier,
		teamDbId,
		createdAt: new Date(stripeEvent.timestamp),
		userDbIdList: teamMembers,
		value: currentMemberCount,
	});
}

async function reportToStripe(customerId: string, currentMemberCount: number) {
	const meterEventId = createId();
	const timestamp = new Date();

	const stripeEvent = await stripe.v2.billing.meterEvents.create({
		event_name: USER_SEAT_METER_NAME,
		payload: {
			value: currentMemberCount.toString(),
			stripe_customer_id: customerId,
		},
		identifier: meterEventId,
		timestamp: timestamp.toISOString(),
	});

	return stripeEvent;
}

async function saveUserSeatUsage(params: {
	stripeMeterEventId: string;
	teamDbId: number;
	createdAt: Date;
	userDbIdList: number[];
	value: number;
}) {
	await db.insert(userSeatUsageReports).values(params);
}

async function findTeamDbId(subscriptionId: string): Promise<number> {
	const record = await db
		.select({ teamDbId: subscriptions.teamDbId })
		.from(subscriptions)
		.where(eq(subscriptions.id, subscriptionId));
	if (record.length === 0) {
		throw new Error(`Subscription not found: ${subscriptionId}`);
	}
	return record[0].teamDbId;
}

async function listTeamMembers(teamDbId: number) {
	const teamMembers = await db
		.select({ userDbId: teamMemberships.userDbId })
		.from(teamMemberships)
		.where(eq(teamMemberships.teamDbId, teamDbId));
	return teamMembers.map((member) => member.userDbId);
}
