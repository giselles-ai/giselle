import type Stripe from "stripe";
import {
	type db,
	stripeBillingCadenceHistories,
	stripePricingPlanSubscriptionHistories,
} from "@/db";
import { logger } from "@/lib/logger";

// Helper type for transaction
type TransactionType = Parameters<Parameters<typeof db.transaction>[0]>[0];

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
 * Records v2 billing cadence and subscription history
 *
 * Creates records in both stripe_billing_cadence_histories and
 * stripe_pricing_plan_subscription_histories tables.
 * Cadence is inserted first to get its dbId for the subscription FK.
 */
export async function recordV2SubscriptionHistory(
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
		willCancelAt: subscription.servicing_status_transitions.will_cancel_at
			? new Date(subscription.servicing_status_transitions.will_cancel_at)
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
		"[recordV2SubscriptionHistory] Recorded v2 subscription history",
	);
}
