import { and, eq, ne } from "drizzle-orm";
import type Stripe from "stripe";
import {
	db,
	stripeBillingCadenceHistories,
	stripeBillingPricingPlanSubscriptionHistories,
	teamMemberships,
	teams,
} from "@/db";
import {
	DRAFT_TEAM_NAME_METADATA_KEY,
	DRAFT_TEAM_USER_DB_ID_METADATA_KEY,
	UPGRADING_TEAM_DB_ID_KEY,
} from "@/services/teams/constants";
import { createTeamId } from "@/services/teams/utils";

/**
 * v2 Pricing Plan Subscription response type
 */
interface PricingPlanSubscription {
	id: string;
	object: string;
	billing_cadence: string;
	pricing_plan: string;
	pricing_plan_version: string;
	metadata: Record<string, string> | null;
	created: string;
	livemode: boolean;
	collection_status: string;
	servicing_status: string;
	servicing_status_transitions: {
		activated_at: string | null;
		canceled_at: string | null;
		paused_at: string | null;
	};
	collection_status_transitions: {
		current_at: string | null;
		past_due_at: string | null;
		paused_at: string | null;
		unpaid_at: string | null;
		awaiting_customer_action_at: string | null;
	};
	test_clock?: string | null;
}

/**
 * v2 Billing Cadence response type
 */
interface BillingCadence {
	id: string;
	object: string;
	created: string;
	next_billing_date: string;
	payer: {
		billing_profile: string;
		customer: string;
		type: string;
	};
	billing_cycle: {
		type: string; // "month" | "year"
		interval_count: number;
		month?: {
			day_of_month: number | null;
			month_of_year: number | null;
			time: {
				hour: number;
				minute: number;
				second: number;
			};
		};
	};
	status: string;
	settings?: {
		bill?: {
			id: string | null;
			version: string | null;
		};
	};
	metadata?: Record<string, string>;
	lookup_key?: string | null;
}

/**
 * Retrieve pricing plan subscription from Stripe v2 API
 */
async function retrievePricingPlanSubscription(
	subscriptionId: string,
): Promise<PricingPlanSubscription> {
	const response = await fetch(
		`https://api.stripe.com/v2/billing/pricing_plan_subscriptions/${subscriptionId}`,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
				"Stripe-Version": "2025-11-17.preview",
			},
		},
	);

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Failed to retrieve subscription: ${error}`);
	}

	return response.json();
}

/**
 * Retrieve billing cadence from Stripe v2 API
 */
async function retrieveBillingCadence(
	cadenceId: string,
): Promise<BillingCadence> {
	const response = await fetch(
		`https://api.stripe.com/v2/billing/cadences/${cadenceId}`,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
				"Stripe-Version": "2025-11-17.preview",
			},
		},
	);

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Failed to retrieve billing cadence: ${error}`);
	}

	return response.json();
}

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
	console.log(`🔔  Pricing plan subscription activated: ${subscriptionId}`);

	// Retrieve subscription from Stripe v2 API
	const subscription = await retrievePricingPlanSubscription(subscriptionId);
	console.log(
		"🔔  v2 subscription data:",
		JSON.stringify(subscription, null, 2),
	);

	// Retrieve billing cadence to get customer ID and next_billing_date
	const cadence = await retrieveBillingCadence(subscription.billing_cadence);
	console.log("🔔  v2 cadence data:", JSON.stringify(cadence, null, 2));

	// Get customer ID from cadence.payer
	const customerId = cadence.payer.customer;
	if (!customerId) {
		throw new Error("Customer ID not found in cadence.payer");
	}

	const metadata: Record<string, string> = subscription.metadata ?? {};

	await db.transaction(async (tx) => {
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
				"Invalid subscription metadata for pricing plan subscription",
			);
		}
	});
}

/**
 * Handle v2.billing.pricing_plan_subscription.servicing_canceled event
 *
 * This event fires when a pricing plan subscription is canceled.
 */
export async function handlePricingPlanServicingCanceled(event: Stripe.Event) {
	const relatedObject = (
		event as unknown as { related_object?: { id: string } }
	).related_object;
	if (!relatedObject?.id) {
		throw new Error(
			"Missing related_object in pricing plan subscription event",
		);
	}

	const subscriptionId = relatedObject.id;
	console.log(`🔔  Pricing plan subscription canceled: ${subscriptionId}`);

	// Retrieve subscription from Stripe v2 API
	const subscription = await retrievePricingPlanSubscription(subscriptionId);
	console.log(
		"🔔  v2 subscription data (canceled):",
		JSON.stringify(subscription, null, 2),
	);

	// Retrieve billing cadence to get customer ID
	const cadence = await retrieveBillingCadence(subscription.billing_cadence);
	console.log(
		"🔔  v2 cadence data (canceled):",
		JSON.stringify(cadence, null, 2),
	);

	// Find the team with this active subscription
	const [team] = await db
		.select({ dbId: teams.dbId, plan: teams.plan })
		.from(teams)
		.where(eq(teams.activeSubscriptionId, subscriptionId))
		.limit(1);

	if (!team) {
		console.log(`No team found with active subscription: ${subscriptionId}`);
		return;
	}

	// Skip if enterprise or internal plan
	if (team.plan === "enterprise" || team.plan === "internal") {
		console.log(`Skipping cancellation for ${team.plan} plan team`);
		return;
	}

	await db.transaction(async (tx) => {
		// Record v2 subscription history (canceled state)
		await recordV2SubscriptionHistory(tx, subscription, cadence, team.dbId);

		// Get the earliest admin's membership ID
		const [earliestAdmin] = await tx
			.select({ id: teamMemberships.id })
			.from(teamMemberships)
			.where(
				and(
					eq(teamMemberships.teamDbId, team.dbId),
					eq(teamMemberships.role, "admin"),
				),
			)
			.orderBy(teamMemberships.id)
			.limit(1);

		if (!earliestAdmin) {
			throw new Error(`No admin found for team (id: ${team.dbId})`);
		}

		// Delete all team memberships except the earliest admin
		await tx
			.delete(teamMemberships)
			.where(
				and(
					eq(teamMemberships.teamDbId, team.dbId),
					ne(teamMemberships.id, earliestAdmin.id),
				),
			);

		// Downgrade team to free plan
		await tx
			.update(teams)
			.set({
				plan: "free",
				activeSubscriptionId: null,
				activeCustomerId: null,
			})
			.where(
				and(
					eq(teams.dbId, team.dbId),
					ne(teams.plan, "internal"),
					ne(teams.plan, "enterprise"),
				),
			);
	});

	console.log(
		`Canceled subscription for team: ${team.dbId}, subscription: ${subscriptionId}`,
	);
}

// Helper type for transaction
type TransactionType = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function createNewProTeam(
	tx: TransactionType,
	subscription: PricingPlanSubscription,
	cadence: BillingCadence,
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

	console.log(
		`Created new pro team: ${team.dbId} for subscription: ${subscription.id}`,
	);
}

async function upgradeExistingTeam(
	tx: TransactionType,
	subscription: PricingPlanSubscription,
	cadence: BillingCadence,
	customerId: string,
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

	console.log(
		`Upgraded team: ${teamDbId} to pro for subscription: ${subscription.id}`,
	);
}

/**
 * Records v2 billing cadence and subscription history
 *
 * Creates records in both stripe_billing_cadence_histories and
 * stripe_billing_pricing_plan_subscription_histories tables.
 * Cadence is inserted first to get its dbId for the subscription FK.
 */
async function recordV2SubscriptionHistory(
	tx: TransactionType,
	subscription: PricingPlanSubscription,
	cadence: BillingCadence,
	teamDbId: number,
) {
	// Insert cadence history first to get its dbId
	const [cadenceHistory] = await tx
		.insert(stripeBillingCadenceHistories)
		.values({
			teamDbId,
			id: cadence.id,
			customerId: cadence.payer.customer,
			billingProfileId: cadence.payer.billing_profile,
			payerType: cadence.payer.type,
			billingCycleType: cadence.billing_cycle.type,
			billingCycleIntervalCount: cadence.billing_cycle.interval_count,
			billingCycleDayOfMonth: cadence.billing_cycle.month?.day_of_month ?? null,
			billingCycleMonthOfYear:
				cadence.billing_cycle.month?.month_of_year ?? null,
			billingCycleTimeHour: cadence.billing_cycle.month?.time.hour ?? 0,
			billingCycleTimeMinute: cadence.billing_cycle.month?.time.minute ?? 0,
			billingCycleTimeSecond: cadence.billing_cycle.month?.time.second ?? 0,
			nextBillingDate: new Date(cadence.next_billing_date),
			status: cadence.status,
			billSettingsId: cadence.settings?.bill?.id ?? null,
			created: new Date(cadence.created),
			metadata: cadence.metadata ?? null,
			lookupKey: cadence.lookup_key ?? null,
		})
		.returning({ dbId: stripeBillingCadenceHistories.dbId });

	// Insert subscription history with cadence FK
	await tx.insert(stripeBillingPricingPlanSubscriptionHistories).values({
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
}
