import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCurrentTeam, isProPlan } from "@/services/teams";
import { manageBilling } from "@/services/teams/actions/manage-billing";
import { upgradeTeam } from "@/services/teams/actions/upgrade-team";
import type { CurrentTeam } from "@/services/teams/types";
import { Suspense } from "react";
import { Card } from "../components/card";
import { getSubscription } from "./actions";
import { LocalDateTime } from "./components/local-date-time";

export default async function BillingSection() {
	const team = await fetchCurrentTeam();

	return (
		<Card title="Billing">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-sm text-zinc-400">Current Plan</p>
					<p className="text-xl font-semibold text-zinc-200">
						{isProPlan(team) ? "Pro" : "Free"} Plan
					</p>

					{team.activeSubscriptionId && (
						<Suspense fallback={<Skeleton className="h-5 w-[300px] mt-2" />}>
							<CancellationNotice subscriptionId={team.activeSubscriptionId} />
						</Suspense>
					)}
				</div>

				{team.type !== "internal" && (
					<form>
						<Suspense
							fallback={<Skeleton className="h-10 w-[120px] rounded-md" />}
						>
							<BillingButton
								subscriptionId={team.activeSubscriptionId}
								team={team}
							/>
						</Suspense>
					</form>
				)}
			</div>
		</Card>
	);
}

type CancellationNoticeProps = {
	subscriptionId: string;
};

async function CancellationNotice({ subscriptionId }: CancellationNoticeProps) {
	const result = await getSubscription(subscriptionId);

	if (!result.success || !result.data) {
		console.error("Failed to fetch subscription:", result.error);
		return null;
	}

	const subscription = result.data;
	if (!subscription.cancelAtPeriodEnd || !subscription.cancelAt) {
		return null;
	}

	return (
		<p className="text-sm text-amber-500 mt-2">
			Subscription will end on <LocalDateTime date={subscription.cancelAt} />
		</p>
	);
}

type BillingButtonProps = {
	subscriptionId: string | null;
	team: CurrentTeam;
};

// NOTE: If this component becomes a client component, we need to remove team.dbId to prevent exposure of internal IDs in the client bundle.
async function BillingButton({ subscriptionId, team }: BillingButtonProps) {
	const upgrateTeamWithTeam = upgradeTeam.bind(null, team);
	if (subscriptionId == null) {
		return (
			<Button className="w-fit" formAction={upgrateTeamWithTeam}>
				Upgrade Plan
			</Button>
		);
	}

	const manageBillingWithSubscriptionId = manageBilling.bind(
		null,
		subscriptionId,
	);
	return (
		<Button className="w-fit" formAction={manageBillingWithSubscriptionId}>
			Manage Billing
		</Button>
	);
}
