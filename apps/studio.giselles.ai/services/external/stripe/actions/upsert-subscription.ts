import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { db, activeSubscriptions, subscriptionHistory, teamMemberships, teams } from "@/db";
import {
	DRAFT_TEAM_NAME_METADATA_KEY,
	DRAFT_TEAM_USER_DB_ID_METADATA_KEY,
	UPGRADING_TEAM_DB_ID_KEY,
} from "@/services/teams/constants";
import { createTeamId } from "@/services/teams/utils";
import { stripe } from "../config";

const timestampToDateTime = (timestamp: number) => new Date(timestamp * 1000);
const getCustomerId = (subscription: Stripe.Subscription) =>
	typeof subscription.customer === "string"
		? subscription.customer
		: subscription.customer.id;

export const upsertSubscription = async (subscriptionId: string) => {
	const subscription = await stripe.subscriptions.retrieve(subscriptionId);
	const isActive = isActiveSubscription(subscription);

	// Check if subscription exists in either table
	const [existingActive] = await db
		.select()
		.from(activeSubscriptions)
		.where(eq(activeSubscriptions.id, subscription.id))
		.limit(1);

	const [existingHistory] = await db
		.select()
		.from(subscriptionHistory)
		.where(eq(subscriptionHistory.id, subscription.id))
		.limit(1);

	if (existingActive || existingHistory) {
		await updateSubscription(subscription, isActive);
		return;
	}

	await activateProTeamSubscription(subscription);
};

function isActiveSubscription(subscription: Stripe.Subscription): boolean {
	return (
		subscription.status === "active" ||
		subscription.status === "trialing" ||
		subscription.status === "past_due" ||
		subscription.ended_at === null
	);
}

async function activateProTeamSubscription(subscription: Stripe.Subscription) {
	const upgradingTeamDbIdKey = UPGRADING_TEAM_DB_ID_KEY;
	if (upgradingTeamDbIdKey in subscription.metadata) {
		const teamDbId = Number.parseInt(
			subscription.metadata[upgradingTeamDbIdKey],
			10,
		);
		await upgradeExistingTeam(subscription, teamDbId);
		return;
	}

	const draftTeamNameKey = DRAFT_TEAM_NAME_METADATA_KEY;
	const draftTeamUserDbIdKey = DRAFT_TEAM_USER_DB_ID_METADATA_KEY;
	if (
		draftTeamNameKey in subscription.metadata &&
		draftTeamUserDbIdKey in subscription.metadata
	) {
		const teamName = subscription.metadata[draftTeamNameKey];
		const userDbId = Number.parseInt(
			subscription.metadata[draftTeamUserDbIdKey],
			10,
		);
		await createNewProTeam(subscription, userDbId, teamName);
		return;
	}

	throw new Error("Invalid subscription metadata");
}

async function createNewProTeam(
	subscription: Stripe.Subscription,
	userDbId: number,
	teamName: string,
) {
	// wrap operations in a transaction to prevent duplicate team and membership creation
	await db.transaction(async (tx) => {
		const teamDbId = await createTeam(tx, userDbId, teamName);
		// if the race condition happens, inserting subscription will successfully raise because of the unique constraint.
		await insertSubscription(tx, subscription, teamDbId);
	});
}

async function upgradeExistingTeam(
	subscription: Stripe.Subscription,
	teamDbId: number,
) {
	await db.transaction(async (tx) => {
		const result = await tx
			.select({ dbId: teams.dbId })
			.from(teams)
			.for("update")
			.where(eq(teams.dbId, teamDbId));
		if (result.length !== 1) {
			throw new Error("Team not found");
		}
		const team = result[0];
		await insertSubscription(tx, subscription, team.dbId);
	});
}

// https://github.com/drizzle-team/drizzle-orm/issues/2853#issuecomment-2481083003
type TransactionType = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function createTeam(
	tx: TransactionType,
	userDbId: number,
	teamName: string,
) {
	const [team] = await tx
		.insert(teams)
		.values({
			id: createTeamId(),
			name: teamName,
		})
		.returning({ dbid: teams.dbId });

	await tx.insert(teamMemberships).values({
		teamDbId: team.dbid,
		userDbId,
		role: "admin",
	});

	return team.dbid;
}

async function insertSubscription(
	tx: TransactionType,
	subscription: Stripe.Subscription,
	teamDbId: number,
) {
	const period = getSubscriptionPeriod(subscription);
	const isActive = isActiveSubscription(subscription);
	const subscriptionData = {
		id: subscription.id,
		teamDbId: teamDbId,
		customerId: getCustomerId(subscription),
		status: subscription.status,
		cancelAtPeriodEnd: subscription.cancel_at_period_end,
		cancelAt:
			subscription.cancel_at !== null
				? timestampToDateTime(subscription.cancel_at)
				: null,
		canceledAt:
			subscription.canceled_at !== null
				? timestampToDateTime(subscription.canceled_at)
				: null,
		currentPeriodStart: timestampToDateTime(period.currentPeriodStart),
		currentPeriodEnd: timestampToDateTime(period.currentPeriodEnd),
		created: timestampToDateTime(subscription.created),
		endedAt:
			subscription.ended_at !== null
				? timestampToDateTime(subscription.ended_at)
				: null,
		trialStart:
			subscription.trial_start !== null
				? timestampToDateTime(subscription.trial_start)
				: null,
		trialEnd:
			subscription.trial_end !== null
				? timestampToDateTime(subscription.trial_end)
				: null,
	};

	if (isActive) {
		await tx.insert(activeSubscriptions).values(subscriptionData);
	} else {
		await tx.insert(subscriptionHistory).values({
			...subscriptionData,
			endedAt: subscriptionData.endedAt ?? timestampToDateTime(subscription.created),
		});
	}
}

async function updateSubscription(
	subscription: Stripe.Subscription,
	isActive: boolean,
) {
	const period = getSubscriptionPeriod(subscription);
	const subscriptionData = {
		customerId: getCustomerId(subscription),
		status: subscription.status,
		cancelAtPeriodEnd: subscription.cancel_at_period_end,
		cancelAt:
			subscription.cancel_at !== null
				? timestampToDateTime(subscription.cancel_at)
				: null,
		canceledAt:
			subscription.canceled_at !== null
				? timestampToDateTime(subscription.canceled_at)
				: null,
		currentPeriodStart: timestampToDateTime(period.currentPeriodStart),
		currentPeriodEnd: timestampToDateTime(period.currentPeriodEnd),
		created: timestampToDateTime(subscription.created),
		endedAt:
			subscription.ended_at !== null
				? timestampToDateTime(subscription.ended_at)
				: null,
		trialStart:
			subscription.trial_start !== null
				? timestampToDateTime(subscription.trial_start)
				: null,
		trialEnd:
			subscription.trial_end !== null
				? timestampToDateTime(subscription.trial_end)
				: null,
	};

	await db.transaction(async (tx) => {
		// Check if subscription exists in active table
		const [existingActive] = await tx
			.select()
			.from(activeSubscriptions)
			.where(eq(activeSubscriptions.id, subscription.id))
			.limit(1);

		// Check if subscription exists in history table
		const [existingHistory] = await tx
			.select()
			.from(subscriptionHistory)
			.where(eq(subscriptionHistory.id, subscription.id))
			.limit(1);

		if (isActive) {
			if (existingActive) {
				// Update existing active subscription
				await tx
					.update(activeSubscriptions)
					.set(subscriptionData)
					.where(eq(activeSubscriptions.id, subscription.id));
			} else if (existingHistory) {
				// Move from history to active (re-activation)
				await tx.delete(subscriptionHistory).where(
					eq(subscriptionHistory.id, subscription.id),
				);
				await tx.insert(activeSubscriptions).values(subscriptionData);
			}
		} else {
			if (existingActive) {
				// Move from active to history (cancellation/expiration)
				await tx.delete(activeSubscriptions).where(
					eq(activeSubscriptions.id, subscription.id),
				);
				await tx.insert(subscriptionHistory).values({
					...subscriptionData,
					endedAt:
						subscriptionData.endedAt ??
						timestampToDateTime(subscription.created),
				});
			} else if (existingHistory) {
				// Update existing history record
				await tx
					.update(subscriptionHistory)
					.set({
						...subscriptionData,
						endedAt:
							subscriptionData.endedAt ??
							timestampToDateTime(subscription.created),
					})
					.where(eq(subscriptionHistory.id, subscription.id));
			}
		}
	});
}

/**
 * Helper function to get subscription period from Basil API
 *
 * In Basil, periods are on subscription items instead of subscription
 */
function getSubscriptionPeriod(subscription: Stripe.Subscription) {
	const proPlanPriceId = process.env.STRIPE_PRO_PLAN_PRICE_ID;
	if (!proPlanPriceId) {
		throw new Error("STRIPE_PRO_PLAN_PRICE_ID is not set");
	}

	// Find the Pro Plan item specifically
	const proPlanItem = subscription.items?.data?.find(
		(item) =>
			typeof item.price === "object" && item.price.id === proPlanPriceId,
	);
	if (!proPlanItem) {
		throw new Error("Pro Plan item not found in subscription");
	}

	return {
		currentPeriodStart: proPlanItem.current_period_start,
		currentPeriodEnd: proPlanItem.current_period_end,
	};
}
