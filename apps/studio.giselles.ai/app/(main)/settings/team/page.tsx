import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCurrentTeam, isProPlan } from "@/services/teams";
import { manageBilling } from "@/services/teams/actions/manage-billing";
import { upgradeTeam } from "@/services/teams/actions/upgrade-team";
import type { CurrentTeam } from "@/services/teams/types";
import { ExternalLink } from "lucide-react";
import { Suspense } from "react";
import { Button } from "../components/button";
import { getSubscription } from "./actions";
import { LocalDateTime } from "./components/local-date-time";
import { DeleteTeam } from "./delete-team";
import { TeamName } from "./team-name";

export default async function TeamPage() {
	return (
		<div className="flex flex-col gap-[24px]">
			<div className="flex justify-between items-center">
				<h3
					className="text-primary-100 font-semibold text-[28px] leading-[28px] tracking-[-0.011em] font-hubot"
					style={{ textShadow: "0px 0px 20px hsla(207, 100%, 48%, 1)" }}
				>
					Settings
				</h3>
				<a
					href="https://docs.giselles.ai/guides/settings/team/billing"
					target="_blank"
					rel="noopener noreferrer"
					className="text-black-300 text-[14px] font-medium border border-black-300 rounded-[4px] px-1.5 py-0.5 hover:bg-black-300/10 flex items-center gap-1.5 font-hubot"
				>
					About Setting
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
					<TeamName />
				</Suspense>

				{/* Billing Section */}
				<div>
					<BillingInfo />
				</div>

				{/* Delete Team Section */}
				<div className="mt-8">
					<h4 className="text-white-400 font-medium text-[18px] leading-[22px] tracking-normal font-hubot mb-4">
						Danger Zone
					</h4>
					<DeleteTeam />
				</div>
			</div>
		</div>
	);
}

// BillingInfoコンポーネント：元のBillingSectionコンポーネントの内容を直接実装
async function BillingInfo() {
	try {
		const team = await fetchCurrentTeam();

		return (
			<div className="flex flex-col gap-y-2">
				<Card className="flex items-center justify-between gap-x-1 py-2 border-none bg-transparent">
					{!isProPlan(team) && (
						<>
							<div className="flex flex-col gap-y-0.5">
								<div className="flex flex-wrap items-center gap-x-1 text-white-800 font-medium">
									<p className="text-[22px] leading-[26.4px] tracking-[-0.04em] font-hubot">
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
								<Suspense
									fallback={<Skeleton className="h-10 w-[120px] rounded-md" />}
								>
									<UpgradeButton team={team} />
								</Suspense>
							</form>
						</>
					)}
				</Card>

				{isProPlan(team) && team.type !== "internal" && (
					<PaymentInfo team={team} />
				)}
			</div>
		);
	} catch (error) {
		console.error("Error in BillingInfo:", error);
		return <div className="text-error-900">設定の読み込みに失敗しました</div>;
	}
}

function UpgradeButton({ team }: { team: CurrentTeam }) {
	const upgradeTeamWithTeam = upgradeTeam.bind(null, team);

	return (
		<Button className="w-fit" formAction={upgradeTeamWithTeam}>
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
		<Button className="w-fit" formAction={manageBillingWithSubscriptionId}>
			Update
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

function PaymentInfo({ team }: { team: CurrentTeam }) {
	if (team.activeSubscriptionId === null) {
		throw new Error("Subscription id not found");
	}

	return (
		<Card className="flex justify-between items-center px-6 py-4 border-[0.5px] border-black-400 rounded-[8px] bg-transparent">
			<div className="flex flex-col gap-y-[2px]">
				<div className="flex flex-col gap-0.5">
					<p className="text-[14px] leading-[16px] font-medium tracking-wide font-hubot text-white-400">
						Thank you for being
					</p>
					<p className="text-[22px] leading-[26.4px] tracking-[-0.04em] font-medium font-hubot">
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
			<form>
				<Suspense fallback={<Skeleton className="h-10 w-[120px] rounded-md" />}>
					<UpdateButton subscriptionId={team.activeSubscriptionId} />
				</Suspense>
			</form>
		</Card>
	);
}
