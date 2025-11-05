import { LocalDateTime } from "./components/local-date-time";

export type AgentActivity = {
	agentId: string;
	agentName: string | null;
	startTime: Date;
	endTime: Date | null;
	usedCharge: number;
};

type AgentUsageTableProps = {
	activities: AgentActivity[];
	containerClassName?: string;
};

export function AgentUsageTable({
	activities,
	containerClassName,
}: AgentUsageTableProps) {
	return (
		<div className="flex flex-col gap-y-2">
			<div className="grid grid-cols-4 items-center gap-2 rounded-[4px] bg-slate-800/40 p-2 font-bold text-inverse text-[12px] leading-[15.6px] tracking-normal font-geist">
				<div>App</div>
				<div>Start Time</div>
				<div>End Time</div>
				<div>Usage Time</div>
			</div>
			<div className={containerClassName}>
				<div className="px-2">
					{activities.length > 0 ? (
						activities.map((activity, idx) => (
							<div
								key={`${activity.agentId}-${new Date(activity.startTime).getTime()}-${idx}`}
								className="grid grid-cols-4 items-center gap-1 py-2 border-b-[0.5px] border-border text-inverse font-sans font-medium text-[12px] leading-[14.4px] tracking-normal"
							>
								<div className="break-words max-w-xs text-blue-80">
									{activity.agentName ?? activity.agentId}
								</div>
								<div>
									<LocalDateTime date={new Date(activity.startTime)} />
								</div>
								<div>
									{activity.endTime ? (
										<LocalDateTime date={new Date(activity.endTime)} />
									) : (
										"-"
									)}
								</div>
								<div>{activity.usedCharge} seconds</div>
							</div>
						))
					) : (
						<div className="text-text-muted text-[12px] leading-[20.4px] tracking-normal font-geist">
							No app usage
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
