import { PageHeading } from "@giselle-internal/ui/page-heading";
import { StatusBadge } from "@giselle-internal/ui/status-badge";
import type { Task, TaskId as TaskIdType } from "@giselles-ai/protocol";
import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { createSearchParamsCache, parseAsInteger } from "nuqs/server";
import { giselle } from "@/app/giselle";
import { db } from "@/db";
import { fetchCurrentTeam } from "@/services/teams/fetch-current-team";
import { Card } from "../settings/components/card";

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
	id: TaskIdType;
	startedAt: number;
	status: Task["status"];
	inputSummary: string | null;
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

function buildTasksHref({ limit, offset }: { limit: number; offset: number }) {
	const params = new URLSearchParams();
	params.set("limit", String(limit));
	params.set("offset", String(offset));
	return `?${params.toString()}`;
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
					status: task.status,
					inputSummary: null,
					origin: {
						type: "github",
						repoName: "GitHub",
					},
				} satisfies UITaskListRow;
			}
			return {
				id: task.id,
				startedAt: task.createdAt,
				status: task.status,
				inputSummary: null,
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
		<div className="px-[40px] py-[24px] flex-1 max-w-[1200px] mx-auto w-full">
			<div className="flex justify-between items-center mb-8">
				<div>
					<PageHeading glow>Tasks</PageHeading>
				</div>

				<div className="flex items-center gap-4">
					<p className="text-sm text-text/60">Showing {tasks.length} task(s)</p>
					{prevOffset != null ? (
						<Link
							className="px-3 py-2 bg-white/10 text-inverse rounded-lg hover:bg-white/20 transition-colors text-sm"
							href={buildTasksHref({
								limit,
								offset: prevOffset,
							})}
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
							href={buildTasksHref({
								limit,
								offset: nextOffset,
							})}
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

			<div className="w-full pt-2 pb-2">
				{tasks.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-16 text-center">
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
					<Card className="!flex !flex-col gap-0 py-2 px-0">
						{/* Header */}
						<div className="grid grid-cols-[1fr_120px] md:grid-cols-[2fr_120px_1fr_1fr_1fr] items-center gap-4 px-[24px] py-2 border-b-[0.5px] border-border-muted">
							<p className="text-[12px] font-geist font-semibold text-text/60 uppercase tracking-wide">
								Task
							</p>
							<p className="text-[12px] font-geist font-semibold text-text/60 uppercase tracking-wide">
								Status
							</p>
							<p className="hidden md:block text-[12px] font-geist font-semibold text-text/60 uppercase tracking-wide">
								Input
							</p>
							<p className="hidden md:block text-[12px] font-geist font-semibold text-text/60 uppercase tracking-wide">
								Model
							</p>
							<p className="hidden md:block text-[12px] font-geist font-semibold text-text/60 uppercase tracking-wide">
								Origin
							</p>
						</div>

						{tasks.map((task) => {
							const originLabel =
								task.origin.type === "app"
									? task.origin.appName
									: task.origin.repoName;
							const inputLabel = task.inputSummary ?? "—";
							const modelLabel = "—";

							return (
								<div
									key={task.id}
									className="grid grid-cols-[1fr_120px] md:grid-cols-[2fr_120px_1fr_1fr_1fr] items-center gap-4 px-[24px] py-3 border-t-[0.5px] border-border-muted first:border-t-0 hover:bg-white/5 transition-colors duration-200"
								>
									<div className="flex flex-col min-w-0">
										<Link
											href={`/tasks/${task.id}`}
											className="truncate text-[14px] font-medium text-white-100 hover:underline"
										>
											{task.id}
										</Link>
										<span className="text-[13px] text-text/60 truncate">
											{formatTimestamp(task.startedAt)}
											<span className="md:hidden"> · {originLabel}</span>
										</span>
									</div>

									<div className="flex items-center justify-start">
										{getStatusBadge(task.status)}
									</div>

									<div className="hidden md:flex min-w-0">
										<span className="text-sm text-white-700 truncate">
											{inputLabel}
										</span>
									</div>

									<div className="hidden md:flex min-w-0">
										<span className="text-sm text-white-700 truncate">
											{modelLabel}
										</span>
									</div>

									<div className="hidden md:flex min-w-0">
										<span className="text-sm text-white-700 truncate">
											{originLabel}
										</span>
									</div>
								</div>
							);
						})}
					</Card>
				)}
			</div>
		</div>
	);
}
