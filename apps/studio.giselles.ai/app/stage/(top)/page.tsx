import { StatusBadge } from "@giselle-internal/ui/status-badge";
import {
	Table,
	TableBody,
	TableCell,
	TableRow,
} from "@giselle-internal/ui/table";
import Link from "next/link";
import { notFound } from "next/navigation";

import { stageFlag } from "@/flags";

import { fetchCurrentUser } from "@/services/accounts";
import { fetchUserTeams } from "@/services/teams";
import { performStageAction } from "./actions";
import { Form } from "./form";

import { ResizableLayout } from "./resizable-layout";
import { fetchEnrichedActs, fetchFlowTriggers } from "./services";
import type { FilterType } from "./types";

// The maximum duration of server actions on this page is extended to 800 seconds through enabled fluid compute.
// https://vercel.com/docs/functions/runtimes#max-duration
export const maxDuration = 800;

export default async function StagePage({
	searchParams,
}: {
	searchParams: Promise<{ filter?: string; teamId?: string }>;
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
						<div className="text-center text-[24px] font-mono font-light text-white-100 bg-transparent px-6">
							What are we perform next ?
						</div>
						<Form
							teamOptions={teamOptions}
							flowTriggers={flowTriggers}
							performStageAction={performStageAction}
						/>
					</div>
				}
				actsContent={
					<div className="space-y-4 py-6 px-4 h-full overflow-y-auto">
						<div className="flex items-center justify-between">
							<h2 className="text-[16px] font-sans text-white-100">Tasks</h2>
							<Link
								href="/stage/acts"
								className="text-[14px] text-white-100 hover:text-white-80 transition-colors"
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
											className="hover:bg-white/5 transition-colors duration-200 cursor-pointer"
										>
											<Link href={act.link} className="contents">
												<TableCell className="text-center w-6">
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
												</TableCell>
												<TableCell className="min-w-[240px]">
													<div className="flex flex-col">
														<span className="truncate">
															{act.workspaceName}
														</span>
														<span className="text-[12px] text-black-600 truncate">
															{new Date(act.createdAt).toLocaleString()} ·{" "}
															{act.teamName}
														</span>
													</div>
												</TableCell>
												<TableCell className="text-right w-4">
													<div className="flex justify-end">{">"}</div>
												</TableCell>
											</Link>
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
