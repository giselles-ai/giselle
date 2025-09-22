import { StatusBadge } from "@giselle-internal/ui/status-badge";
import {
	Table,
	TableBody,
	TableCell,
	TableRow,
} from "@giselle-internal/ui/table";
import { FlowTriggerId } from "@giselle-sdk/data-type";
import Link from "next/link";
import { notFound } from "next/navigation";
import { stageFlag } from "@/flags";
import { fetchCurrentUser } from "@/services/accounts";
import { fetchUserTeams } from "@/services/teams";
import { performStageAction } from "./actions";
import { FormContainer } from "./form";
import { ResizableLayout } from "./resizable-layout";
import { loadSearchParams } from "./search-params";
import { fetchEnrichedActs, fetchFlowTriggers } from "./services";
import type { FilterType, TeamId } from "./types";

// The maximum duration of server actions on this page is extended to 800 seconds through enabled fluid compute.
// https://vercel.com/docs/functions/runtimes#max-duration
export const maxDuration = 800;

export default async function StagePage({
	searchParams,
}: {
	searchParams: Promise<{ filter?: string; teamId?: string; appId?: string }>;
}) {
	const enableStage = await stageFlag();
	if (!enableStage) {
		return notFound();
	}

	const searchParamsResolved = await searchParams;
	// Default to 'all' when no filter param, otherwise use the specified filter
	const filterType = (searchParamsResolved.filter as FilterType) || "all";
	const user = await fetchCurrentUser();
	const teams = await fetchUserTeams();
	const acts = await fetchEnrichedActs(teams, user);
	const flowTriggers = await fetchFlowTriggers(teams, filterType, user);

	const { appId: unsafeAppId } = await loadSearchParams(searchParams);

	let defaultAppId: FlowTriggerId | undefined;
	let defaultTeamId: TeamId | undefined;
	if (unsafeAppId !== undefined) {
		const result = FlowTriggerId.safeParse(unsafeAppId);
		if (result.success) {
			defaultAppId = result.data;
			defaultTeamId = flowTriggers.find(
				(trigger) => trigger.sdkData.id === defaultAppId,
			)?.teamId;
		}
	}
	const teamOptions = teams.map((team) => ({
		value: team.id,
		label: team.name,
		avatarUrl: team.avatarUrl ?? undefined,
	}));
	return (
		<div className="flex-1 bg-[var(--color-stage-background)] pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 h-full flex flex-col">
			<ResizableLayout
				mainContent={
					<div className="space-y-6 py-6 h-full md:h-full max-h-full overflow-y-auto md:overflow-hidden relative">
						<div className="text-center text-[24px] font-mono font-light text-text bg-transparent px-6">
							What are we perform next ?
						</div>
						<FormContainer
							teamOptions={teamOptions}
							flowTriggers={flowTriggers}
							performStageAction={performStageAction}
							defaultTeamId={defaultTeamId}
							defaultAppId={defaultAppId}
						/>
					</div>
				}
				actsContent={
					<div className="space-y-4 py-6 px-4 h-full overflow-y-auto">
						<div className="flex items-center justify-between">
							<h2 className="text-[16px] font-sans text-text">Tasks</h2>
							<Link
								href="/stage/acts"
								className="text-[14px] text-text hover:text-text transition-colors"
							>
								All{">"}
							</Link>
						</div>
						<Table className="table-fixed w-full">
							<TableBody>
								{acts.map((act) => {
									return (
										<TableRow
											key={act.id}
											className="hover:bg-ghost-element-hover-subtle transition-colors duration-200 cursor-pointer last:border-b-0 rounded-lg"
										>
											<TableCell className="text-center w-6">
												<Link href={act.link} className="block">
													<div className="flex justify-center">
														{act.status === "inProgress" && (
															<StatusBadge
																status="info"
																variant="dot"
																className="border-none p-0 [&_span]:hidden"
															/>
														)}
														{act.status === "completed" && (
															<StatusBadge
																status="success"
																variant="dot"
																className="border-none p-0 [&_span]:hidden"
															/>
														)}
														{act.status === "failed" && (
															<StatusBadge
																status="error"
																variant="dot"
																className="border-none p-0 [&_span]:hidden"
															/>
														)}
														{act.status === "cancelled" && (
															<StatusBadge
																status="ignored"
																variant="dot"
																className="border-none p-0 [&_span]:hidden"
															/>
														)}
													</div>
												</Link>
											</TableCell>
											<TableCell className="min-w-[240px]">
												<Link href={act.link} className="block">
													<div className="flex flex-col">
														<span className="truncate">
															{act.workspaceName}
														</span>
														<span className="text-[12px] text-text-muted truncate">
															{new Date(act.createdAt).toLocaleString()} ·{" "}
															{act.teamName}
														</span>
													</div>
												</Link>
											</TableCell>
											<TableCell className="text-right w-4">
												<Link href={act.link} className="block">
													<div className="flex justify-end">{">"}</div>
												</Link>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
				}
			/>
		</div>
	);
}
