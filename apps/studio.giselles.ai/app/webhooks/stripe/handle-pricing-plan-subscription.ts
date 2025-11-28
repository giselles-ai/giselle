import { and, desc, eq, ne } from "drizzle-orm";
import type Stripe from "stripe";
import {
	db,
	stripeBillingCadenceHistories,
	stripePricingPlanSubscriptionHistories,
	teamMemberships,
	teams,
} from "@/db";
import { logger } from "@/lib/logger";
import { stripe } from "@/services/external/stripe";
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
			const teamDbId = Number.parseInt(metadata[UPGRADING_TEAM_DB_ID_KEY], 10);
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
 * Records v2 billing cadence and subscription history
 *
 * Creates records in both stripe_billing_cadence_histories and
 * stripe_pricing_plan_subscription_histories tables.
 * Cadence is inserted first to get its dbId for the subscription FK.
 */
async function recordV2SubscriptionHistory(
	tx: TransactionType,
	subscription: Stripe.V2.Billing.PricingPlanSubscription,
	cadence: Stripe.V2.Billing.Cadence,
	teamDbId: number,
) {
	// Get billing cycle time based on cycle type
	const billingCycleTime = getBillingCycleTime(cadence.billing_cycle);

	// Insert cadence history first to get its dbId
	const [cadenceHistory] = await tx
		.insert(stripeBillingCadenceHistories)
		.values({
			teamDbId,
			id: cadence.id,
			customerId: cadence.payer.customer ?? "",
			billingProfileId: cadence.payer.billing_profile,
			payerType: cadence.payer.type,
			billingCycleType: cadence.billing_cycle.type,
			billingCycleIntervalCount: cadence.billing_cycle.interval_count,
			billingCycleDayOfMonth: cadence.billing_cycle.month?.day_of_month ?? null,
			billingCycleMonthOfYear:
				cadence.billing_cycle.month?.month_of_year ?? null,
			billingCycleTimeHour: billingCycleTime.hour,
			billingCycleTimeMinute: billingCycleTime.minute,
			billingCycleTimeSecond: billingCycleTime.second,
			nextBillingDate: cadence.next_billing_date
				? new Date(cadence.next_billing_date)
				: new Date(),
			status: cadence.status,
			billSettingsId: cadence.settings?.bill?.id ?? null,
			created: new Date(cadence.created),
			metadata: cadence.metadata ?? null,
			lookupKey: cadence.lookup_key ?? null,
		})
		.returning({ dbId: stripeBillingCadenceHistories.dbId });

	// Insert subscription history with cadence FK
	await tx.insert(stripePricingPlanSubscriptionHistories).values({
		teamDbId,
		billingCadenceDbId: cadenceHistory.dbId,
		id: subscription.id,
		billingCadenceId: cadence.id,
		pricingPlanId: subscription.pricing_plan,
		pricingPlanVersionId: subscription.pricing_plan_version,
		servicingStatus: subscription.servicing_status,
		collectionStatus: subscription.collection_status,
		activatedAt: subscription.servicing_status_transitions.activated_at
			? new Date(subscription.servicing_status_transitions.activated_at)
			: null,
		canceledAt: subscription.servicing_status_transitions.canceled_at
			? new Date(subscription.servicing_status_transitions.canceled_at)
			: null,
		pausedAt: subscription.servicing_status_transitions.paused_at
			? new Date(subscription.servicing_status_transitions.paused_at)
			: null,
		collectionCurrentAt: subscription.collection_status_transitions.current_at
			? new Date(subscription.collection_status_transitions.current_at)
			: null,
		collectionPastDueAt: subscription.collection_status_transitions.past_due_at
			? new Date(subscription.collection_status_transitions.past_due_at)
			: null,
		collectionPausedAt: subscription.collection_status_transitions.paused_at
			? new Date(subscription.collection_status_transitions.paused_at)
			: null,
		collectionUnpaidAt: subscription.collection_status_transitions.unpaid_at
			? new Date(subscription.collection_status_transitions.unpaid_at)
			: null,
		collectionAwaitingCustomerActionAt: subscription
			.collection_status_transitions.awaiting_customer_action_at
			? new Date(
					subscription.collection_status_transitions
						.awaiting_customer_action_at,
				)
			: null,
		created: new Date(subscription.created),
		metadata: subscription.metadata ?? null,
	});

	logger.debug(
		{ teamDbId, cadenceId: cadence.id, subscriptionId: subscription.id },
		"[stripe-v2-webhook] Recorded v2 subscription history",
	);
}

/**
 * Extracts billing cycle time from the cadence billing_cycle object
 */
function getBillingCycleTime(
	billingCycle: Stripe.V2.Billing.Cadence.BillingCycle,
): {
	hour: number;
	minute: number;
	second: number;
} {
	const timeSource =
		billingCycle.month?.time ??
		billingCycle.day?.time ??
		billingCycle.week?.time ??
		billingCycle.year?.time;

	return {
		hour: timeSource?.hour ?? 0,
		minute: timeSource?.minute ?? 0,
		second: timeSource?.second ?? 0,
	};
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
				`No subscription history found for canceled subscription ${subscriptionId}`,
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
