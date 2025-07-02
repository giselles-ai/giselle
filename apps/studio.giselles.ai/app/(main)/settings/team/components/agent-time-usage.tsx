import { cn } from "@/lib/utils";
import { AGENT_TIME_CHARGE_LIMIT_MINUTES } from "@/services/agents/activities";
import { Alert, AlertDescription, AlertTitle } from "../../components/alert";

export function AgentTimeUsageForFreePlan({
	usedMinutes,
}: {
	usedMinutes: number;
}) {
	const includedMinutes = AGENT_TIME_CHARGE_LIMIT_MINUTES.FREE;
	const warningMessage =
		"Your free plan limit is almost reached. Upgrade to Pro for unlimited usage.";
	const overLimitMessage =
		"You've reached your free plan limit. Please upgrade to continue using the service.";
	return (
		<AgentTimeUsage
			usedMinutes={usedMinutes}
			includedMinutes={includedMinutes}
			warningMessage={warningMessage}
			overLimitMessage={overLimitMessage}
		/>
	);
}

export function AgentTimeUsageForProPlan({
	usedMinutes,
}: {
	usedMinutes: number;
}) {
	const includedMinutes = AGENT_TIME_CHARGE_LIMIT_MINUTES.PRO;
	const warningMessage =
		"Getting close to your monthly limit. Usage beyond this limit will be billed additionally";
	const overLimitMessage = "Additional minutes are subject to extra charges";

	return (
		<AgentTimeUsage
			usedMinutes={usedMinutes}
			includedMinutes={includedMinutes}
			warningMessage={warningMessage}
			overLimitMessage={overLimitMessage}
		/>
	);
}

type AgentTimeUsageProps = {
	/** Minutes used */
	usedMinutes: number;
	/** Minutes included in the plan */
	includedMinutes: number;
	/** Warning threshold ratio (decimal between 0-1) */
	warningThreshold?: number;
	/** Message displayed when approaching threshold */
	warningMessage?: string;
	/** Message displayed when exceeding limit */
	overLimitMessage?: string;
};

function AgentTimeUsage(props: AgentTimeUsageProps) {
	const {
		usedMinutes,
		includedMinutes,
		warningThreshold = 0.8,
		warningMessage = "",
		overLimitMessage = "",
	} = props;

	const percentage = (usedMinutes / includedMinutes) * 100;
	const isOverLimit = usedMinutes > includedMinutes;
	const isNearLimit =
		usedMinutes >= includedMinutes * warningThreshold && !isOverLimit;
	const remainingMinutes = Number((includedMinutes - usedMinutes).toFixed(2));
	const overMinutes = Number((usedMinutes - includedMinutes).toFixed(2));

	return (
		<>
			<h2 className="sr-only">Agent Time Usage</h2>
			<div className="flex justify-between items-baseline">
				<div />
				<div className="text-right">
					<div
						className={cn(
							"text-sm font-bold text-white-900 leading-[23.8px] tracking-normal font-geist",
						)}
					>
						{isOverLimit ? (
							<span className="flex items-center gap-x-2">
								{includedMinutes} min +{" "}
								<span className="text-error-900">{overMinutes} min used</span>
							</span>
						) : (
							<span>{usedMinutes} min used</span>
						)}
					</div>
					<div className="font-medium text-[12px] leading-[20.4px] tracking-normal font-geist text-primary-200">
						{Math.round(percentage)}% of your monthly limit used
					</div>
				</div>
			</div>

			<div className="flex flex-col gap-y-2">
				<div className="flex flex-col gap-y-1">
					<div className="relative w-full h-2">
						<div className="absolute w-full h-full rounded-full bg-black-80" />
						<div
							className="absolute h-full rounded-full bg-white-400 transition-all duration-300"
							style={{
								width: `${Math.min(100, percentage)}%`,
							}}
						/>
						{isOverLimit && (
							<div
								className="absolute h-full rounded-r-full bg-error-900 transition-all duration-300"
								style={{
									width: `${(overMinutes / includedMinutes) * 100}%`,
									left: "100%",
									transform: "translateX(-100%)",
								}}
							/>
						)}
					</div>

					<div className="flex justify-between text-white-400 font-medium text-[12px] leading-[20.4px] tracking-normal font-geist">
						<span>0 min</span>
						<span>
							{isOverLimit ? `${usedMinutes} min` : `${includedMinutes} min`}
						</span>
					</div>
				</div>

				<div className="text-primary-200 font-medium text-[12px] leading-[20.4px] tracking-normal font-geist">
					{includedMinutes} minutes included with your plan
				</div>

				{isNearLimit && (
					<Alert className="border-warning-900 p-4">
						<CustumAlertTriangleIcon className="text-warning-900" />

						<div>
							<AlertTitle className="mb-0 text-warning-900 font-bold text-[12px] leading-[20.4px] tracking-normal font-geist">
								Only {remainingMinutes}{" "}
								{remainingMinutes === 1 ? "minute" : "minutes"} remaining in
								your plan
							</AlertTitle>

							<AlertDescription className="text-warning-900 opacity-70 font-medium text-[12px] leading-[20.4px] tracking-normal font-geist">
								{warningMessage}
							</AlertDescription>
						</div>
					</Alert>
				)}

				{isOverLimit && (
					<Alert variant="destructive" className="p-4 flex">
						<CustumAlertTriangleIcon className="text-error-900" />

						<div>
							<AlertTitle className="mb-0 text-error-900 font-bold text-[12px] leading-[20.4px] tracking-normal font-geist">
								{overMinutes} minutes over your plan limit
							</AlertTitle>
							<AlertDescription className="text-error-900 opacity-70 font-medium text-[12px] leading-[20.4px] tracking-normal font-geist">
								{overLimitMessage}
							</AlertDescription>
						</div>
					</Alert>
				)}
			</div>
		</>
	);
}

function CustumAlertTriangleIcon({ className }: { className?: string }) {
	return (
		<svg
			className={cn("size-[18px] stroke-black-850 opacity-80", className)}
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<title>Alert triangle icon</title>
			<path
				fill="currentColor"
				stroke="none"
				d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
			/>
			<path d="M12 9v4" />
			<path d="M12 17h.01" />
		</svg>
	);
}
