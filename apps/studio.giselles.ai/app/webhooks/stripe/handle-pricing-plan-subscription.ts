import { and, eq, ne } from "drizzle-orm";
import type Stripe from "stripe";
import { db, subscriptionHistories, teamMemberships, teams } from "@/db";
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
	status: string;
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

	// Record subscription history
	await recordSubscriptionHistory(
		tx,
		subscription,
		cadence,
		customerId,
		team.dbId,
	);

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

	// Record subscription history
	await recordSubscriptionHistory(
		tx,
		subscription,
		cadence,
		customerId,
		teamDbId,
	);

	console.log(
		`Upgraded team: ${teamDbId} to pro for subscription: ${subscription.id}`,
	);
}

/**
 * Map v2 servicing_status to v1 Stripe.Subscription.Status
 */
function mapServicingStatusToSubscriptionStatus(
	servicingStatus: string,
): Stripe.Subscription.Status {
	switch (servicingStatus) {
		case "active":
			return "active";
		case "canceled":
			return "canceled";
		case "paused":
			return "paused";
		case "pending":
			return "incomplete";
		default:
			return "active";
	}
}

/**
 * Records a subscription state snapshot to subscription_histories table
 */
async function recordSubscriptionHistory(
	tx: TransactionType,
	subscription: PricingPlanSubscription,
	cadence: BillingCadence,
	customerId: string,
	teamDbId: number,
) {
	// Use cadence.created as period start and next_billing_date as period end
	const currentPeriodStart = new Date(cadence.created);
	const currentPeriodEnd = new Date(cadence.next_billing_date);
	const created = new Date(subscription.created);
	const canceledAt = subscription.servicing_status_transitions.canceled_at
		? new Date(subscription.servicing_status_transitions.canceled_at)
		: null;

	await tx.insert(subscriptionHistories).values({
		id: subscription.id,
		teamDbId: teamDbId,
		customerId: customerId,
		status: mapServicingStatusToSubscriptionStatus(
			subscription.servicing_status,
		),
		cancelAtPeriodEnd: false, // v2 doesn't have this concept
		cancelAt: null, // v2 doesn't have scheduled cancellation
		canceledAt: canceledAt,
		currentPeriodStart,
		currentPeriodEnd,
		created,
		endedAt: canceledAt, // Use canceled_at as ended_at for v2
		trialStart: null, // v2 doesn't expose trial info in this response
		trialEnd: null,
	});
}
