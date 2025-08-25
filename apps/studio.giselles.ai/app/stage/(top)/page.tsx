import { Button } from "@giselle-internal/ui/button";
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

import { fetchUserTeams } from "@/services/teams";
import { performStageAction } from "./actions";
import { Form } from "./form";
import { ReloadButton } from "./reload-button";
import { ResizableLayout } from "./resizable-layout";
import { fetchEnrichedActs, fetchFlowTriggers, reloadPage } from "./services";

// The maximum duration of server actions on this page is extended to 800 seconds through enabled fluid compute.
// https://vercel.com/docs/functions/runtimes#max-duration
export const maxDuration = 800;

export default async function StagePage() {
	const enableStage = await stageFlag();
	if (!enableStage) {
		return notFound();
	}
	const teams = await fetchUserTeams();
	const teamOptions = teams.map((team) => ({
		value: team.id,
		label: team.name,
		avatarUrl: team.avatarUrl ?? undefined,
	}));
	const acts = await fetchEnrichedActs(teams);
	const flowTriggers = await fetchFlowTriggers(teams);
	return (
		<div className="flex-1 bg-[var(--color-stage-background)] pt-16 md:pt-0 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 h-full flex flex-col">
			<ResizableLayout
				mainContent={
					<div className="space-y-6 py-6 h-full md:h-full h-auto max-h-full overflow-y-auto md:overflow-hidden relative">
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
							<div className="flex items-center gap-3">
								<ReloadButton reloadAction={reloadPage} />
								<Button type="button" variant="subtle">
									Archive
								</Button>
							</div>
						</div>
						<Table className="table-fixed w-full">
							<TableBody>
								{acts.map((act) => {
									return (
										<TableRow
											key={act.id}
											className="hover:bg-white/5 transition-colors duration-200"
										>
											<TableCell className="w-12 !p-0 !m-0">
												<div className="w-10 h-10 bg-gray-600 rounded-md flex items-center justify-center">
													<span className="text-xs text-gray-400">App</span>
												</div>
											</TableCell>
											<TableCell className="min-w-[240px]">
												<div className="flex flex-col">
													<span className="truncate">{act.workspaceName}</span>
													<span className="text-[12px] text-black-600 truncate">
														{new Date(act.createdAt).toLocaleString()} ·{" "}
														{act.teamName}
													</span>
												</div>
											</TableCell>
											<TableCell className="text-center w-24">
												{act.status === "inProgress" && (
													<StatusBadge status="info" variant="dot">
														Running
													</StatusBadge>
												)}
												{act.status === "completed" && (
													<StatusBadge status="success" variant="dot">
														Completed
													</StatusBadge>
												)}
												{act.status === "failed" && (
													<StatusBadge status="error" variant="dot">
														Failed
													</StatusBadge>
												)}
												{act.status === "cancelled" && (
													<StatusBadge status="ignored" variant="dot">
														Cancelled
													</StatusBadge>
												)}
											</TableCell>
											<TableCell className="text-right w-20">
												<div className="flex justify-end">
													<Link href={act.link}>More {">"}</Link>
												</div>
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
