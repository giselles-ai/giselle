import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { proTeamPlanFlag } from "@/flags";
import { fetchCurrentTeam, isProPlan } from "@/services/teams";
import { manageBilling } from "@/services/teams/actions/manage-billing";
import { upgradeTeam } from "@/services/teams/actions/upgrade-team";
import { Suspense } from "react";
import { Card } from "../components/card";
import { getSubscription } from "./actions";
import { LocalDateTime } from "./components/local-date-time";

export default async function BillingSection() {
	const team = await fetchCurrentTeam();
	const proTeamPlan = await proTeamPlanFlag();

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

				{proTeamPlan && team.type !== "internal" && (
					<form>
						<Suspense
							fallback={<Skeleton className="h-10 w-[120px] rounded-md" />}
						>
							<BillingButton
								subscriptionId={team.activeSubscriptionId}
								teamDbId={team.dbId}
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
	teamDbId: number;
};

async function BillingButton({ subscriptionId, teamDbId }: BillingButtonProps) {
	const upgrateTeamWithTeamDbId = upgradeTeam.bind(null, teamDbId);
	if (subscriptionId == null) {
		return (
			<Button className="w-fit" formAction={upgrateTeamWithTeamDbId}>
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
