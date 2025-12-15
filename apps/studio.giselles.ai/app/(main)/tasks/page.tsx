import {
	GenerationOrigin,
	type ParametersInput,
	type Task,
	type TaskId,
} from "@giselles-ai/protocol";
import { createSearchParamsCache, parseAsInteger } from "nuqs/server";
import { giselle } from "@/app/giselle";
import { db } from "@/db";
import { logger } from "@/lib/logger";
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
	input: ParametersInput | null;
}

/**
 * Since the input for executing a Task is not stored in the Task itself
 * but in the Generation, we retrieve it from the Generation of the first Step
 * associated with the Task.
 */
async function getTaskInput(taskId: TaskId) {
	const task = await giselle.getTask({ taskId });
	const firstStep = task.sequences[0]?.steps?.[0];
	if (firstStep === undefined) {
		logger.warn(`Task ${taskId} has no steps`);
		return null;
	}
	const firstStepGeneration = await giselle.getGeneration(
		firstStep.generationId,
	);
	if (firstStepGeneration === undefined) {
		logger.warn(`Task ${taskId}, Step ${firstStep.id} has no generation`);
		return null;
	}
	const inputs = firstStepGeneration?.context.inputs;

	// inputs is an optional array, but in the Task use case it should be
	// an array with length 1, so log a warning if it's different
	if (inputs?.length !== 1) {
		return null;
	}
	const firstInput = inputs[0];
	// github-webhook-event is not expected in this Task use case
	if (firstInput.type !== "parameters") {
		return null;
	}
	return firstInput;
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
			const [task, input] = await Promise.all([
				giselle.getTask({ taskId: dbTask.id }),
				getTaskInput(dbTask.id),
			]);
			if (dbTask.app === null) {
				return {
					id: task.id,
					startedAt: task.createdAt,
					finishedAt: task.createdAt,
					status: task.status,
					origin: {
						type: "github",
						repoName: "test",
					},
					input,
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
				input,
			} satisfies UITaskListRow;
		}),
	);
	return (
		<pre>
			{JSON.stringify(
				{
					limit,
					offset,
					hasNextPage,
					nextOffset: hasNextPage ? offset + limit : null,
					prevOffset: offset - limit >= 0 ? offset - limit : null,
					tasks,
				},
				null,
				2,
			)}
		</pre>
	);
}
