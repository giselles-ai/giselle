import { DocsLink } from "@giselle-internal/ui/docs-link";
import { PageHeading } from "@giselle-internal/ui/page-heading";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimestamp } from "@/packages/lib/utils";
import { getLatestSubscriptionV2 } from "@/services/subscriptions/get-latest-subscription-v2";
import { fetchCurrentTeam, formatPlanName, isProPlan } from "@/services/teams";
import { manageBilling } from "@/services/teams/actions/manage-billing";
import type { CurrentTeam } from "@/services/teams/types";
import { Button } from "../components/button";
import { Card } from "../components/card";
import { CancelSubscriptionButton } from "./cancel-subscription-button";
import { DeleteTeam } from "./delete-team";
import { TeamProfile } from "./team-profile";

export default function TeamPage() {
	return (
		<div className="flex flex-col gap-[24px]">
			<div className="flex justify-between items-center">
				<PageHeading as="h1" glow>
					Team Settings
				</PageHeading>
				<DocsLink
					href="https://docs.giselles.ai/en/guides/settings/team/general"
					target="_blank"
					rel="noopener noreferrer"
				>
					About Team Settings
				</DocsLink>
			</div>
			<div className="flex flex-col gap-y-[16px]">
				<Suspense
					fallback={
						<div className="w-full h-24">
							<Skeleton className="h-full w-full" />
						</div>
					}
				>
					<TeamProfile />
				</Suspense>

				{/* Billing Section */}
				<BillingInfo />

				{/* Delete Team Section */}
				<div className="mt-8">
					<h4 className="text-error-900 font-medium text-[18px] leading-[22px] tracking-normal font-sans mb-4">
						Danger Zone
					</h4>
					<DeleteTeam />
				</div>
			</div>
		</div>
	);
}

async function BillingInfo() {
	const team = await fetchCurrentTeam();

	return (
		<div className="flex flex-col gap-y-2">
			<Card title="" className="px-6 py-4">
				{isProPlan(team) ? (
					<BillingInfoForProPlan team={team} />
				) : (
					<BillingInfoForFreePlan team={team} />
				)}
			</Card>
		</div>
	);
}

interface BillingInfoProps {
	team: CurrentTeam;
}

function BillingInfoForFreePlan({ team }: BillingInfoProps) {
	if (isProPlan(team)) {
		return null;
	}
	return (
		<div className="flex justify-between items-center">
			<div className="flex flex-col gap-y-0.5">
				<div className="flex flex-wrap items-center gap-x-1 text-inverse font-medium">
					<p className="text-[22px] leading-[26.4px] tracking-[-0.04em] font-sans">
						{formatPlanName(team.plan)}
					</p>
				</div>
				<p className="text-link-muted font-medium text-[12px] leading-[20.4px] font-geist">
					Have questions about your plan?{" "}
					<a
						href="https://giselles.ai/pricing"
						target="_blank"
						className="text-blue-80 underline"
						rel="noreferrer"
					>
						Learn about plans and pricing
					</a>
				</p>
			</div>
			<form>
				<Suspense fallback={<Skeleton className="h-10 w-[120px] rounded-md" />}>
					<UpgradeButton team={team} />
				</Suspense>
			</form>
		</div>
	);
}
async function BillingInfoForProPlan({ team }: BillingInfoProps) {
	if (!isProPlan(team)) {
		return null;
	}

	// Get willCancelAt for v2 subscriptions
	let willCancelAt: Date | null = null;
	if (team.activeSubscriptionId?.startsWith("bpps_")) {
		const subscription = await getLatestSubscriptionV2(
			team.activeSubscriptionId,
		);
		willCancelAt = subscription?.subscription.willCancelAt ?? null;
	}

	return (
		<div className="flex justify-between items-center">
			<div className="flex flex-col gap-y-[2px]">
				<div className="flex flex-col gap-0.5">
					<p className="text-[22px] leading-[26.4px] tracking-[-0.04em] font-medium font-sans">
						<span className="text-primary-400">
							{formatPlanName(team.plan)}
						</span>
					</p>
					{willCancelAt && (
						<p className="text-black-30 font-medium text-[14px] leading-[20px] font-geist">
							Cancels {formatTimestamp.toLongDate(willCancelAt.getTime())}
						</p>
					)}
				</div>
				<p className="text-link-muted font-medium text-[12px] leading-[20.4px] font-geist">
					Have questions about your plan?{" "}
					<a
						href="https://giselles.ai/pricing"
						target="_blank"
						className="text-blue-80 underline"
						rel="noreferrer"
					>
						Learn about plans and pricing
					</a>
				</p>
			</div>
			{team.activeSubscriptionId && (
				<div className="flex flex-col items-end gap-2">
					<form>
						<Suspense
							fallback={<Skeleton className="h-10 w-[120px] rounded-md" />}
						>
							<UpdateButton subscriptionId={team.activeSubscriptionId} />
						</Suspense>
					</form>
					{!willCancelAt && (
						<CancelSubscriptionButton
							subscriptionId={team.activeSubscriptionId}
						/>
					)}
				</div>
			)}
		</div>
	);
}

function UpgradeButton({ team }: { team: CurrentTeam }) {
	void team;

	return (
		<Button asChild variant="primary" className="px-4">
			<Link href="/settings/team/upgrade">Upgrade to Pro</Link>
		</Button>
	);
}

function UpdateButton({ subscriptionId }: { subscriptionId: string }) {
	const manageBillingWithSubscriptionId = manageBilling.bind(
		null,
		subscriptionId,
	);

	return (
		<Button
			formAction={manageBillingWithSubscriptionId}
			variant="primary"
			className="px-4"
		>
			Manage Subscription
		</Button>
	);
}
