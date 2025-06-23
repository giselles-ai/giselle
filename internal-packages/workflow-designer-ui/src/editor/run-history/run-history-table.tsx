import { EmptyState } from "@giselle-internal/ui/empty-state";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@giselle-internal/ui/table";
import clsx from "clsx/lite";
import { useGiselleEngine, useWorkflowDesigner } from "giselle-sdk/react";
import {
	CircleAlertIcon,
	CircleCheckIcon,
	CircleDashedIcon,
	CircleDotIcon,
	CircleXIcon,
} from "lucide-react";
import useSWR from "swr";

function formatDuration(elapsedMs: number): string {
	const elapsedSeconds = elapsedMs / 1000;

	if (elapsedSeconds < 60) {
		// Less than 1 minute: show as "30.4s"
		return `${elapsedSeconds.toFixed(1)}s`;
	}
	// 1 minute or more: show as "2m 30s"
	const minutes = Math.floor(elapsedSeconds / 60);
	const seconds = Math.floor(elapsedSeconds % 60);
	return `${minutes}m ${seconds}s`;
}

function formatTimestamp(timestamp: number): string {
	const date = new Date(timestamp);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");
	return `${year}/${month}/${day} ${hours}:${minutes}`;
}

export function RunHistoryTable() {
	const client = useGiselleEngine();
	const { data: workspace } = useWorkflowDesigner();
	const { data, isLoading } = useSWR(
		{
			namespace: "getWorkspaceFlowRuns",
			workspaceId: workspace.id,
		},
		({ workspaceId }) => client.getWorkspaceFlowRuns({ workspaceId }),
	);
	if (isLoading) {
		return null;
	}
	return (
		<div className="h-full bg-surface-background p-[16px]">
			<div className="flex justify-between items-center">
				<h1 className="font-accent text-text text-[18px] mb-[8px]">
					Run history
				</h1>
			</div>
			{data === undefined ? (
				<EmptyState title="no data" />
			) : (
				<Table className="table-auto font-mono">
					<TableHeader>
						<TableRow>
							<TableHead className="w-[180px]">Time</TableHead>
							<TableHead className="w-[100px]">Status</TableHead>
							<TableHead className="w-[100px]">Steps</TableHead>
							<TableHead className="w-[100px]">Trigger</TableHead>
							<TableHead className="w-[120px]">
								Duration
								<br />
								(Wall-Clock)
							</TableHead>
							<TableHead className="w-[120px]">
								Duration
								<br />
								(Total tasks)
							</TableHead>
							<TableHead />
							<TableHead />
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.runs.map((item) => (
							<TableRow
								data-status={item.status}
								className="group"
								key={item.id}
							>
								<TableCell>{formatTimestamp(item.createdAt)}</TableCell>
								<TableCell>
									<span
										className={clsx(
											"group-data-[status=completed]:text-success",
											"group-data-[status=inProgress]:text-info",
											"group-data-[status=failed]:text-error",
										)}
									>
										{item.status}
									</span>
								</TableCell>
								<TableCell>
									<div className="">
										{Object.entries(item.steps).map(([stepType, count]) => (
											<div
												key={stepType}
												className="flex items-center gap-[3px]"
											>
												{count > 0 && stepType === "queued" && (
													<CircleDashedIcon className="size-[13px] text-hint" />
												)}
												{count > 0 && stepType === "inProgress" && (
													<CircleDotIcon className="size-[13px] text-info" />
												)}
												{count > 0 && stepType === "completed" && (
													<CircleCheckIcon className="size-[13px] text-success" />
												)}
												{count > 0 && stepType === "warning" && (
													<CircleAlertIcon className="size-[13px] text-warning" />
												)}
												{count > 0 && stepType === "failed" && (
													<CircleXIcon className="size-[13px] text-error" />
												)}
												{count > 0 && (
													<span className="text-[11px]">{count}</span>
												)}
											</div>
										))}
									</div>
								</TableCell>
								<TableCell>{item.trigger}</TableCell>
								<TableCell>{formatDuration(item.duration.wallClock)}</TableCell>
								<TableCell>{formatDuration(item.duration.totalTask)}</TableCell>
								<TableCell>
									<div className="flex w-[400px]">
										<div className="truncate text-text-muted text-[12px]">
											{item.annotations
												.map((annotation) => annotation.message)
												.join(",")}
										</div>
									</div>
								</TableCell>
								<TableCell />
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	);
}
