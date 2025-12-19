import { and, desc, eq, ne } from "drizzle-orm";
import { DrizzleQueryError } from "drizzle-orm/errors";
import type Stripe from "stripe";
import {
	db,
	stripePricingPlanSubscriptionHistories,
	teamMemberships,
	teams,
} from "@/db";
import { logger } from "@/lib/logger";
import { stripe } from "@/services/external/stripe";
import { recordV2SubscriptionHistory } from "@/services/subscriptions/record-v2-subscription-history";
import {
	DRAFT_TEAM_NAME_METADATA_KEY,
	DRAFT_TEAM_USER_DB_ID_METADATA_KEY,
	UPGRADING_TEAM_DB_ID_KEY,
} from "@/services/teams/constants";
import { createTeamId } from "@/services/teams/utils";

/**
 * Handle v2.billing.pricing_plan_subscription.servicing_activated event
 *
 * This event fires when a customer completes checkout and the pricing plan subscription is activated.
 */
export async function handlePricingPlanServicingActivated(event: Stripe.Event) {
	// v2 events have related_object instead of data.object for the subscription reference
	const relatedObject = (
		event as unknown as { related_object?: { id: string } }
	).related_object;
	if (!relatedObject?.id) {
		throw new Error(
			"Missing related_object in pricing plan subscription event",
		);
	}

	const subscriptionId = relatedObject.id;
	logger.info(
		{ subscriptionId },
		"[stripe-v2-webhook] Pricing plan subscription activated",
	);

	// Retrieve subscription from Stripe v2 API
	const subscription =
		await stripe.v2.billing.pricingPlanSubscriptions.retrieve(subscriptionId);
	logger.debug(
		{ subscription },
		"[stripe-v2-webhook] Retrieved subscription data",
	);

	// Retrieve billing cadence to get customer ID and next_billing_date
	const cadence = await stripe.v2.billing.cadences.retrieve(
		subscription.billing_cadence,
	);
	logger.debug({ cadence }, "[stripe-v2-webhook] Retrieved cadence data");

	// Get customer ID from cadence.payer
	const customerId = cadence.payer.customer;
	if (!customerId) {
		throw new Error("Customer ID not found in cadence.payer");
	}

	const metadata: Record<string, string> = subscription.metadata ?? {};

	try {
		await db.transaction(async (tx) => {
			// Idempotency check: if subscription history already exists, just update the team
			const [existing] = await tx
				.select({ teamDbId: stripePricingPlanSubscriptionHistories.teamDbId })
				.from(stripePricingPlanSubscriptionHistories)
				.where(eq(stripePricingPlanSubscriptionHistories.id, subscription.id))
				.orderBy(desc(stripePricingPlanSubscriptionHistories.createdAt))
				.limit(1);

			if (existing) {
				logger.info(
					{ subscriptionId: subscription.id, teamDbId: existing.teamDbId },
					"[stripe-v2-webhook] Subscription already processed, updating existing team",
				);
				await updateExistingTeam(
					tx,
					subscription,
					cadence,
					customerId,
					existing.teamDbId,
				);
				return;
			}

			// Check if this is an upgrade of existing team or new team creation
			if (UPGRADING_TEAM_DB_ID_KEY in metadata) {
				const teamDbId = Number.parseInt(
					metadata[UPGRADING_TEAM_DB_ID_KEY],
					10,
				);
				await upgradeExistingTeam(
					tx,
					subscription,
					cadence,
					customerId,
					teamDbId,
				);
			} else if (
				DRAFT_TEAM_NAME_METADATA_KEY in metadata &&
				DRAFT_TEAM_USER_DB_ID_METADATA_KEY in metadata
			) {
				const teamName = metadata[DRAFT_TEAM_NAME_METADATA_KEY];
				const userDbId = Number.parseInt(
					metadata[DRAFT_TEAM_USER_DB_ID_METADATA_KEY],
					10,
				);
				await createNewProTeam(
					tx,
					subscription,
					cadence,
					customerId,
					userDbId,
					teamName,
				);
			} else {
				throw new Error(
					`Invalid subscription metadata for pricing plan subscription. Expected one of: [${UPGRADING_TEAM_DB_ID_KEY}, (${DRAFT_TEAM_NAME_METADATA_KEY} & ${DRAFT_TEAM_USER_DB_ID_METADATA_KEY})]. Actual keys: [${Object.keys(metadata).join(", ")}]`,
				);
			}
		});
	} catch (error) {
		if (isActiveSubscriptionIdViolation(error)) {
			logger.info(
				{ subscriptionId: subscription.id },
				"[stripe-v2-webhook] Subscription already processed",
			);
			return;
		}

		throw error;
	}
}

function isPostgresError(
	value: unknown,
): value is { code: string; constraint: string } {
	return (
		typeof value === "object" &&
		value !== null &&
		"code" in value &&
		"constraint" in value
	);
}

function isActiveSubscriptionIdViolation(error: unknown): boolean {
	if (!(error instanceof DrizzleQueryError)) {
		return false;
	}

	if (!isPostgresError(error.cause)) {
		return false;
	}

	return (
		error.cause.code === "23505" &&
		error.cause.constraint === "teams_active_subscription_id_unique"
	);
}

// Helper type for transaction
type TransactionType = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function createNewProTeam(
	tx: TransactionType,
	subscription: Stripe.V2.Billing.PricingPlanSubscription,
	cadence: Stripe.V2.Billing.Cadence,
	customerId: string,
	userDbId: number,
	teamName: string,
) {
	const [team] = await tx
		.insert(teams)
		.values({
			id: createTeamId(),
			name: teamName,
			plan: "pro",
			activeSubscriptionId: subscription.id,
			activeCustomerId: customerId,
		})
		.returning({ dbId: teams.dbId });

	await tx.insert(teamMemberships).values({
		teamDbId: team.dbId,
		userDbId,
		role: "admin",
	});

	// Record v2 subscription history
	await recordV2SubscriptionHistory(tx, subscription, cadence, team.dbId);

	logger.info(
		{ teamDbId: team.dbId, subscriptionId: subscription.id },
		"[stripe-v2-webhook] Created new pro team",
	);
}

async function upgradeExistingTeam(
	tx: TransactionType,
	subscription: Stripe.V2.Billing.PricingPlanSubscription,
	cadence: Stripe.V2.Billing.Cadence,
	customerId: string,
	teamDbId: number,
) {
	const result = await tx
		.select({ dbId: teams.dbId })
		.from(teams)
		.for("update")
		.where(eq(teams.dbId, teamDbId));

	if (result.length !== 1) {
		throw new Error(`Team not found: ${teamDbId}`);
	}

	await tx
		.update(teams)
		.set({
			plan: "pro",
			activeSubscriptionId: subscription.id,
			activeCustomerId: customerId,
		})
		.where(
			and(
				eq(teams.dbId, teamDbId),
				ne(teams.plan, "internal"),
				ne(teams.plan, "enterprise"),
			),
		);

	// Record v2 subscription history
	await recordV2SubscriptionHistory(tx, subscription, cadence, teamDbId);

	logger.info(
		{ teamDbId, subscriptionId: subscription.id },
		"[stripe-v2-webhook] Upgraded team to pro",
	);
}

/**
 * Updates an existing team when webhook is retried (idempotency handling)
 *
 * This function is called when a subscription history already exists,
 * indicating this webhook event has been processed before.
 *
 * Note: We intentionally create new history records on each retry.
 * History tables are designed to store multiple snapshots of the same
 * subscription, allowing us to track state changes and aid debugging.
 * The idempotency guarantee is for team creation, not history records.
 */
async function updateExistingTeam(
	tx: TransactionType,
	subscription: Stripe.V2.Billing.PricingPlanSubscription,
	cadence: Stripe.V2.Billing.Cadence,
	customerId: string,
	teamDbId: number,
) {
	// Update team's subscription tracking fields
	await tx
		.update(teams)
		.set({
			plan: "pro",
			activeSubscriptionId: subscription.id,
			activeCustomerId: customerId,
		})
		.where(
			and(
				eq(teams.dbId, teamDbId),
				ne(teams.plan, "internal"),
				ne(teams.plan, "enterprise"),
			),
		);

	// Record new subscription state to history
	await recordV2SubscriptionHistory(tx, subscription, cadence, teamDbId);

	logger.info(
		{ teamDbId, subscriptionId: subscription.id },
		"[stripe-v2-webhook] Updated existing team (idempotent retry)",
	);
}

/**
 * Handle v2.billing.pricing_plan_subscription.servicing_canceled event
 *
 * This event fires when a pricing plan subscription is canceled.
 * The team is downgraded from "pro" to "free".
 */
export async function handlePricingPlanServicingCanceled(event: Stripe.Event) {
	// v2 events have related_object instead of data.object for the subscription reference
	const relatedObject = (
		event as unknown as { related_object?: { id: string } }
	).related_object;
	if (!relatedObject?.id) {
		throw new Error(
			"Missing related_object in pricing plan subscription event",
		);
	}

	const subscriptionId = relatedObject.id;
	logger.info(
		{ subscriptionId },
		"[stripe-v2-webhook] Pricing plan subscription canceled",
	);

	// Retrieve subscription from Stripe v2 API
	const subscription =
		await stripe.v2.billing.pricingPlanSubscriptions.retrieve(subscriptionId);
	logger.debug(
		{ subscription },
		"[stripe-v2-webhook] Retrieved subscription data",
	);

	// Retrieve billing cadence
	const cadence = await stripe.v2.billing.cadences.retrieve(
		subscription.billing_cadence,
	);
	logger.debug({ cadence }, "[stripe-v2-webhook] Retrieved cadence data");

	await db.transaction(async (tx) => {
		// Find team by subscription history
		const [existing] = await tx
			.select({ teamDbId: stripePricingPlanSubscriptionHistories.teamDbId })
			.from(stripePricingPlanSubscriptionHistories)
			.where(eq(stripePricingPlanSubscriptionHistories.id, subscription.id))
			.orderBy(desc(stripePricingPlanSubscriptionHistories.createdAt))
			.limit(1);

		if (!existing) {
			throw new Error(
				`No subscription history found for canceled subscription ${subscription.id}`,
			);
		}

		// Downgrade team to free plan
		// Note: WHERE condition ensures idempotency - if already canceled,
		// activeSubscriptionId is null and no rows will be updated
		await tx
			.update(teams)
			.set({
				plan: "free",
				activeSubscriptionId: null,
				activeCustomerId: null,
			})
			.where(
				and(
					eq(teams.dbId, existing.teamDbId),
					eq(teams.activeSubscriptionId, subscription.id),
					ne(teams.plan, "internal"),
					ne(teams.plan, "enterprise"),
				),
			);

		// Record cancellation in history
		await recordV2SubscriptionHistory(
			tx,
			subscription,
			cadence,
			existing.teamDbId,
		);

		logger.info(
			{ teamDbId: existing.teamDbId, subscriptionId: subscription.id },
			"[stripe-v2-webhook] Downgraded team to free",
		);
	});
}
