import { StatusBadge } from "@giselle-internal/ui/status-badge";
import type { Task, TaskId } from "@giselles-ai/protocol";
import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { createSearchParamsCache, parseAsInteger } from "nuqs/server";
import { giselle } from "@/app/giselle";
import { db } from "@/db";
import { fetchCurrentTeam } from "@/services/teams/fetch-current-team";

interface UITaskListAppOrigin {
	type: "app";
	appName: string;
}
interface UITaskListGitHubOrigin {
	type: "github";
	repoName: string;
}
type UITaskListOrigin = UITaskListAppOrigin | UITaskListGitHubOrigin;

interface UITaskListRow {
	id: TaskId;
	startedAt: number;
	finishedAt: number;
	status: Task["status"];
	origin: UITaskListOrigin;
}

const searchParamsCache = createSearchParamsCache({
	limit: parseAsInteger.withDefault(50),
	offset: parseAsInteger.withDefault(0),
});

type TaskListPageProps = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function clampInt(value: number, { min, max }: { min: number; max: number }) {
	return Math.min(max, Math.max(min, value));
}

function formatTimestamp(ms: number) {
	return new Date(ms).toISOString().slice(0, 19).replace("T", " ");
}

function getStatusBadge(taskStatus: Task["status"]) {
	if (taskStatus === "inProgress") {
		return (
			<StatusBadge status="info" variant="dot">
				Running
			</StatusBadge>
		);
	}
	if (taskStatus === "completed" || taskStatus === "created") {
		return (
			<StatusBadge status="success" variant="dot">
				Completed
			</StatusBadge>
		);
	}
	if (taskStatus === "failed") {
		return (
			<StatusBadge status="error" variant="dot">
				Failed
			</StatusBadge>
		);
	}
	return (
		<StatusBadge status="ignored" variant="dot">
			Cancelled
		</StatusBadge>
	);
}

export default async function TaskListPage({
	searchParams,
}: TaskListPageProps) {
	const { limit: rawLimit, offset: rawOffset } =
		await searchParamsCache.parse(searchParams);

	const limit = clampInt(rawLimit, { min: 1, max: 100 });
	const offset = Math.max(0, rawOffset);

	const team = await fetchCurrentTeam();

	// Fetch one extra row to determine whether there's a next page.
	const dbTasks = await db.query.tasks.findMany({
		columns: { id: true, appDbId: true, createdAt: true },
		where: (tasks, { eq }) => eq(tasks.teamDbId, team.dbId),
		orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
		limit: limit + 1,
		offset,
		with: {
			app: {
				columns: {
					workspaceDbId: true,
				},
				with: {
					workspace: {
						columns: {
							name: true,
						},
					},
				},
			},
		},
	});

	const hasNextPage = dbTasks.length > limit;
	const _dbTasks = hasNextPage ? dbTasks.slice(0, limit) : dbTasks;

	const tasks = await Promise.all(
		_dbTasks.map(async (dbTask) => {
			const task = await giselle.getTask({ taskId: dbTask.id });
			if (dbTask.app === null) {
				return {
					id: task.id,
					startedAt: task.createdAt,
					finishedAt: task.createdAt,
					status: task.status,
					origin: {
						type: "github",
						repoName: "GitHub",
					},
				} satisfies UITaskListRow;
			}
			return {
				id: task.id,
				startedAt: task.createdAt,
				finishedAt: task.createdAt,
				status: task.status,
				origin: {
					type: "app",
					appName: dbTask.app.workspace.name ?? "Untitled App",
				},
			} satisfies UITaskListRow;
		}),
	);

	const nextOffset = hasNextPage ? offset + limit : null;
	const prevOffset = offset - limit >= 0 ? offset - limit : null;

	return (
		<div className="bg-bg text-foreground h-full font-sans overflow-y-hidden">
			<div className="max-w-[640px] mx-auto px-4 flex flex-col h-full">
				<div className="w-full pb-3 bg-[color:var(--color-background)]">
					<div className="h-4 bg-gradient-to-b from-[color:var(--color-background)] to-transparent pointer-events-none" />
					<div className="mx-auto pt-2">
						<div className="flex items-end justify-between gap-4">
							<div>
								<h3 className="text-[20px] font-normal text-inverse">Tasks</h3>
								<p className="text-sm text-text/60">
									Showing {tasks.length} task(s)
								</p>
							</div>
							<div className="flex items-center gap-2">
								{prevOffset != null ? (
									<Link
										className="px-3 py-2 bg-white/10 text-inverse rounded-lg hover:bg-white/20 transition-colors text-sm"
										href={`?limit=${limit}&offset=${prevOffset}`}
									>
										Prev
									</Link>
								) : (
									<span className="px-3 py-2 bg-white/5 text-text/40 rounded-lg text-sm cursor-not-allowed">
										Prev
									</span>
								)}
								{nextOffset != null ? (
									<Link
										className="px-3 py-2 bg-white/10 text-inverse rounded-lg hover:bg-white/20 transition-colors text-sm"
										href={`?limit=${limit}&offset=${nextOffset}`}
									>
										Next
									</Link>
								) : (
									<span className="px-3 py-2 bg-white/5 text-text/40 rounded-lg text-sm cursor-not-allowed">
										Next
									</span>
								)}
							</div>
						</div>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto overflow-x-hidden pb-8">
					{tasks.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-full text-center">
							<div className="mb-4 flex items-center justify-center">
								<div className="relative drop-shadow-[0_5px_5px_rgba(0,0,255,0.4)]">
									<ClipboardList
										className="relative z-10 h-9 w-9 text-[#B8E8F4]"
										strokeWidth={0.8}
									/>
									<div className="absolute inset-0 rounded-full bg-[#0087F6] opacity-30 blur-[10px]" />
								</div>
							</div>
							<h2 className="mb-2 text-lg font-medium text-link-muted">
								No tasks yet
							</h2>
							<p className="mb-6 max-w-sm text-sm text-link-muted">
								Start by creating your first task from the main stage page.
							</p>
							<Link
								href="/stage"
								className="px-4 py-2 bg-white/10 text-inverse rounded-lg hover:bg-white/20 transition-colors text-sm"
							>
								Create new task
							</Link>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="table-fixed w-full text-sm">
								<thead>
									<tr className="border-b border-white-400/10">
										<th className="text-left py-3 px-4 text-white-400 font-normal text-xs w-auto max-w-96">
											Task
										</th>
										<th className="text-left py-3 px-4 text-white-400 font-normal text-xs w-auto hidden md:table-cell">
											Origin
										</th>
										<th className="py-3 px-4 text-white-400 font-normal text-xs text-center w-24">
											Status
										</th>
									</tr>
								</thead>
								<tbody>
									{tasks.map((task) => {
										const originLabel =
											task.origin.type === "app"
												? task.origin.appName
												: task.origin.repoName;

										return (
											<tr
												key={task.id}
												className="border-b border-white-400/10 hover:bg-white/5 transition-colors duration-200"
											>
												<td className="py-3 px-4 text-white-800 whitespace-nowrap w-auto max-w-96">
													<div className="flex flex-col min-w-0">
														<Link
															href={`/tasks/${task.id}`}
															className="truncate font-medium text-white-100 hover:underline"
														>
															{task.id}
														</Link>
														<span className="text-sm text-text/60 truncate">
															{formatTimestamp(task.startedAt)}
														</span>
													</div>
												</td>
												<td className="py-3 px-4 text-white-800 whitespace-nowrap w-auto hidden md:table-cell">
													<span className="text-sm text-white-700 truncate">
														{originLabel}
													</span>
												</td>
												<td className="py-3 px-4 text-white-800 whitespace-nowrap text-center w-24">
													<div className="flex items-center justify-center">
														{getStatusBadge(task.status)}
													</div>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
