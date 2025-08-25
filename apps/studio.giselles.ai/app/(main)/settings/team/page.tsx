import { ExternalLink } from "lucide-react";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCurrentTeam, isProPlan } from "@/services/teams";
import { manageBilling } from "@/services/teams/actions/manage-billing";
import { upgradeTeam } from "@/services/teams/actions/upgrade-team";
import type { CurrentTeam } from "@/services/teams/types";
import { Button } from "../components/button";
import { Card } from "../components/card";
import { getSubscription } from "./actions";
import { LocalDateTime } from "./components/local-date-time";
import { DeleteTeam } from "./delete-team";
import { TeamProfile } from "./team-profile";

export default function TeamPage() {
	return (
		<div className="flex flex-col gap-[24px]">
			<div className="flex justify-between items-center">
				<h1
					className="text-[30px] font-sans font-medium text-[hsl(192,73%,84%)]"
					style={{
						textShadow: "0 0 20px #0087f6, 0 0 40px #0087f6, 0 0 60px #0087f6",
					}}
				>
					Team Settings
				</h1>
				<a
					href="https://docs.giselles.ai/guides/settings/team/billing"
					target="_blank"
					rel="noopener noreferrer"
					className="text-black-300 text-[14px] font-medium rounded-[4px] px-1.5 py-0.5 hover:bg-black-300/10 flex items-center gap-1.5 font-sans"
				>
					About Team Settings
					<ExternalLink size={14} />
				</a>
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
				<div className="flex flex-wrap items-center gap-x-1 text-white-800 font-medium">
					<p className="text-[22px] leading-[26.4px] tracking-[-0.04em] font-sans">
						Free Plan
					</p>
				</div>
				<p className="text-black-400 font-medium text-[12px] leading-[20.4px] font-geist">
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
function BillingInfoForProPlan({ team }: BillingInfoProps) {
	if (!isProPlan(team)) {
		return null;
	}
	return (
		<div className="flex justify-between items-center">
			<div className="flex flex-col gap-y-[2px]">
				<div className="flex flex-col gap-0.5">
					<p className="text-[22px] leading-[26.4px] tracking-[-0.04em] font-medium font-sans">
						<span className="text-primary-400">Pro Plan</span>
					</p>
				</div>
				<p className="text-black-400 font-medium text-[12px] leading-[20.4px] font-geist">
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
				{team.activeSubscriptionId && (
					<Suspense fallback={<Skeleton className="h-5 w-[300px] mt-2" />}>
						<CancellationNotice subscriptionId={team.activeSubscriptionId} />
					</Suspense>
				)}
			</div>
			{team.activeSubscriptionId && (
				<form>
					<Suspense
						fallback={<Skeleton className="h-10 w-[120px] rounded-md" />}
					>
						<UpdateButton subscriptionId={team.activeSubscriptionId} />
					</Suspense>
				</form>
			)}
		</div>
	);
}

function UpgradeButton({ team }: { team: CurrentTeam }) {
	const upgradeTeamWithTeam = upgradeTeam.bind(null, team);

	return (
		<Button
			formAction={upgradeTeamWithTeam}
			className="rounded-lg px-4 py-2 text-white/80 transition-all duration-200 active:scale-[0.98]"
			style={{
				background: "linear-gradient(180deg, #202530 0%, #12151f 100%)",
				border: "1px solid rgba(0,0,0,0.7)",
				boxShadow:
					"inset 0 1px 1px rgba(255,255,255,0.05), 0 2px 8px rgba(5,10,20,0.4), 0 1px 2px rgba(0,0,0,0.3)",
			}}
		>
			Upgrade to Pro
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
			className="rounded-lg px-4 py-2 text-white/80 transition-all duration-200 active:scale-[0.98]"
			style={{
				background: "linear-gradient(180deg, #202530 0%, #12151f 100%)",
				border: "1px solid rgba(0,0,0,0.7)",
				boxShadow:
					"inset 0 1px 1px rgba(255,255,255,0.05), 0 2px 8px rgba(5,10,20,0.4), 0 1px 2px rgba(0,0,0,0.3)",
			}}
		>
			Manage Subscription
		</Button>
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
		<p className="mt-2 font-medium text-sm leading-[20.4px] text-warning-900 font-geist">
			Subscription will end on <LocalDateTime date={subscription.cancelAt} />
		</p>
	);
}
