import { and, desc, eq, ne } from "drizzle-orm";
import type Stripe from "stripe";
import { db, subscriptionHistories, teamMemberships, teams } from "@/db";
import {
	DRAFT_TEAM_NAME_METADATA_KEY,
	DRAFT_TEAM_USER_DB_ID_METADATA_KEY,
	UPGRADING_TEAM_DB_ID_KEY,
} from "@/services/teams/constants";
import { createTeamId } from "@/services/teams/utils";
import { stripe } from "../config";

// https://github.com/drizzle-team/drizzle-orm/issues/2853#issuecomment-2481083003
type TransactionType = Parameters<Parameters<typeof db.transaction>[0]>[0];

const timestampToDateTime = (timestamp: number) => new Date(timestamp * 1000);
const getCustomerId = (subscription: Stripe.Subscription) =>
	typeof subscription.customer === "string"
		? subscription.customer
		: subscription.customer.id;

export const upsertSubscription = async (subscriptionId: string) => {
	// Fetch from Stripe (external API call should be outside transaction)
	const subscription = await stripe.subscriptions.retrieve(subscriptionId);

	// Wrap entire operation in transaction to prevent race conditions
	await db.transaction(async (tx) => {
		// Check existence within transaction for consistent read
		const [existing] = await tx
			.select()
			.from(subscriptionHistories)
			.where(eq(subscriptionHistories.id, subscription.id))
			.orderBy(desc(subscriptionHistories.createdAt))
			.limit(1);

		if (existing) {
			await updateSubscription(tx, subscription, existing.teamDbId);
		} else {
			await activateProTeamSubscription(tx, subscription);
		}
	});
};

async function activateProTeamSubscription(
	tx: TransactionType,
	subscription: Stripe.Subscription,
) {
	const upgradingTeamDbIdKey = UPGRADING_TEAM_DB_ID_KEY;
	if (upgradingTeamDbIdKey in subscription.metadata) {
		const teamDbId = Number.parseInt(
			subscription.metadata[upgradingTeamDbIdKey],
			10,
		);
		await upgradeExistingTeam(tx, subscription, teamDbId);
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
		await createNewProTeam(tx, subscription, userDbId, teamName);
		return;
	}

	throw new Error("Invalid subscription metadata");
}

async function createNewProTeam(
	tx: TransactionType,
	subscription: Stripe.Subscription,
	userDbId: number,
	teamName: string,
) {
	const teamDbId = await createTeam(tx, userDbId, teamName);
	await insertSubscription(tx, subscription, teamDbId);
}

async function upgradeExistingTeam(
	tx: TransactionType,
	subscription: Stripe.Subscription,
	teamDbId: number,
) {
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
}

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
			plan: "pro",
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
	// Record subscription state to history
	await recordSubscriptionHistory(tx, subscription, teamDbId);

	// Update team plan and active subscription tracking
	if (subscription.status === "active") {
		// Active: Set subscription tracking fields
		await tx
			.update(teams)
			.set({
				plan: "pro",
				activeSubscriptionId: subscription.id,
				activeCustomerId: getCustomerId(subscription),
			})
			.where(
				and(
					eq(teams.dbId, teamDbId),
					ne(teams.plan, "internal"),
					ne(teams.plan, "enterprise"),
				),
			);
	} else {
		// Non-active: Only clear if this subscription is currently the active one
		await tx
			.update(teams)
			.set({
				plan: "free",
				activeSubscriptionId: null,
				activeCustomerId: null,
			})
			.where(
				and(
					eq(teams.dbId, teamDbId),
					eq(teams.activeSubscriptionId, subscription.id),
					ne(teams.plan, "internal"),
					ne(teams.plan, "enterprise"),
				),
			);
	}
}

async function updateSubscription(
	tx: TransactionType,
	subscription: Stripe.Subscription,
	teamDbId: number,
) {
	// Record new subscription state from Stripe to history
	await recordSubscriptionHistory(tx, subscription, teamDbId);

	// Update team plan and active subscription tracking
	if (subscription.status === "active") {
		// Active: Set subscription tracking fields
		await tx
			.update(teams)
			.set({
				plan: "pro",
				activeSubscriptionId: subscription.id,
				activeCustomerId: getCustomerId(subscription),
			})
			.where(
				and(
					eq(teams.dbId, teamDbId),
					ne(teams.plan, "internal"),
					ne(teams.plan, "enterprise"),
				),
			);
	} else {
		// Non-active: Only clear if this subscription is currently the active one
		await tx
			.update(teams)
			.set({
				plan: "free",
				activeSubscriptionId: null,
				activeCustomerId: null,
			})
			.where(
				and(
					eq(teams.dbId, teamDbId),
					eq(teams.activeSubscriptionId, subscription.id),
					ne(teams.plan, "internal"),
					ne(teams.plan, "enterprise"),
				),
			);
	}
}

/**
 * Records a subscription state snapshot to subscription_histories table
 */
async function recordSubscriptionHistory(
	tx: TransactionType,
	subscription: Stripe.Subscription,
	teamDbId: number,
) {
	const period = getSubscriptionPeriod(subscription);

	await tx.insert(subscriptionHistories).values({
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
