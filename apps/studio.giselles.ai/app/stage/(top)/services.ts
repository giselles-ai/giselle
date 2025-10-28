import {
	isTriggerNode,
	type Workspace,
	type WorkspaceId,
} from "@giselle-sdk/data-type";
import { defaultName } from "@giselle-sdk/giselle";
import { giselleEngine } from "@/app/giselle-engine";
import { type acts as actsSchema, db } from "@/db";
import { fetchCurrentUser } from "@/services/accounts";
import type { FilterType, FlowTriggerUIItem, TeamId } from "./types";

// This feature is currently under development and data structures change destructively,
// so parsing of legacy data frequently fails. We're using a rough try-catch to ignore
// data that fails to parse. This should be properly handled when the feature flag is removed.
async function enrichActWithNavigationData(
	act: typeof actsSchema.$inferSelect,
	teams: { dbId: number; name: string }[],
): Promise<{
	id: string;
	status: "created" | "inProgress" | "completed" | "cancelled" | "failed";
	sequences: Array<{ steps: Array<{ id: string; status: string }> }>;
	link: string;
	teamName: string;
	workspaceName: string;
	createdAt: Date;
} | null> {
	try {
		const tmpAct = await giselleEngine.getAct({ actId: act.sdkActId });
		const team = teams.find((t) => t.dbId === act.teamDbId);
		if (team === undefined) {
			throw new Error("Team not found");
		}
		const tmpWorkspace = await giselleEngine.getWorkspace(act.sdkWorkspaceId);

		const findStepByStatus = (status: string) => {
			for (const sequence of tmpAct.sequences) {
				for (const step of sequence.steps) {
					if (step.status === status) {
						return step;
					}
				}
			}
			return null;
		};

		const getFirstStep = () => {
			if (tmpAct.sequences.length === 0) {
				return null;
			}
			const firstSequence = tmpAct.sequences[0];
			if (firstSequence.steps.length === 0) {
				return null;
			}
			return firstSequence.steps[0];
		};

		const getLastStep = () => {
			if (tmpAct.sequences.length === 0) {
				return null;
			}
			const lastSequence = tmpAct.sequences[tmpAct.sequences.length - 1];
			if (lastSequence.steps.length === 0) {
				return null;
			}
			return lastSequence.steps[lastSequence.steps.length - 1];
		};

		let link = `/stage/acts/${tmpAct.id}`;
		let targetStep = null;

		switch (tmpAct.status) {
			case "created":
			case "inProgress":
				targetStep = findStepByStatus("running") ?? getFirstStep();
				break;
			case "completed":
				targetStep = getLastStep();
				break;
			case "cancelled":
				targetStep = findStepByStatus("cancelled");
				break;
			case "failed":
				targetStep = findStepByStatus("failed");
				break;
			default: {
				const _exhaustiveCheck: never = tmpAct.status;
				throw new Error(`Unhandled status: ${_exhaustiveCheck}`);
			}
		}

		if (targetStep) {
			link += `/${targetStep.id}`;
		}
		return {
			...tmpAct,
			link,
			teamName: team.name,
			workspaceName: tmpWorkspace.name ?? "Untitled",
			createdAt: act.createdAt,
		};
	} catch {
		return null;
	}
}

export async function fetchEnrichedActs(
	teams: { dbId: number; name: string }[],
	user: Awaited<ReturnType<typeof fetchCurrentUser>>,
): Promise<
	Array<{
		id: string;
		status: "created" | "inProgress" | "completed" | "cancelled" | "failed";
		sequences: Array<{ steps: Array<{ id: string; status: string }> }>;
		link: string;
		teamName: string;
		workspaceName: string;
		createdAt: Date;
	}>
> {
	const sevenDaysAgo = new Date();
	sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

	const dbActs = await db.query.acts.findMany({
		where: (acts, { eq, gte, and }) =>
			and(eq(acts.directorDbId, user.dbId), gte(acts.createdAt, sevenDaysAgo)),
		orderBy: (acts, { desc }) => [desc(acts.createdAt)],
		limit: 10,
	});

	const acts = await Promise.all(
		dbActs.map((dbAct) => enrichActWithNavigationData(dbAct, teams)),
	).then((tmp) => tmp.filter((actOrNull) => actOrNull !== null));

	return acts;
}

export async function fetchFlowTriggers(
	teams: { dbId: number; id: TeamId; name: string }[],
	filterType: FilterType = "all",
	user?: Awaited<ReturnType<typeof fetchCurrentUser>>,
): Promise<FlowTriggerUIItem[]> {
	const flowTriggers: Array<FlowTriggerUIItem> = [];
	const currentUser = user ?? (await fetchCurrentUser());

	// Get user's act history for filtering
	const userActs =
		filterType === "history"
			? await db.query.acts.findMany({
					where: (acts, { eq }) => eq(acts.directorDbId, currentUser.dbId),
					columns: {
						sdkFlowTriggerId: true,
					},
				})
			: [];

	const usedFlowTriggerIds = new Set(
		userActs.map((act) => act.sdkFlowTriggerId),
	);

	for (const team of teams) {
		// Build query conditions based on filter type
		let tmpFlowTriggers: Awaited<
			ReturnType<typeof db.query.flowTriggers.findMany>
		>;

		if (filterType === "latest") {
			// Filter for flow triggers updated in the last 7 days
			const sevenDaysAgo = new Date();
			sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
			tmpFlowTriggers = await db.query.flowTriggers.findMany({
				where: (flowTriggers, { eq, gte, and }) =>
					and(
						eq(flowTriggers.teamDbId, team.dbId),
						gte(flowTriggers.updatedAt, sevenDaysAgo),
					),
			});
		} else {
			tmpFlowTriggers = await db.query.flowTriggers.findMany({
				where: (flowTriggers, { eq }) => eq(flowTriggers.teamDbId, team.dbId),
			});
		}

		const workspaceMap: Map<WorkspaceId, Workspace> = new Map();

		for (const tmpFlowTrigger of tmpFlowTriggers) {
			if (!workspaceMap.has(tmpFlowTrigger.sdkWorkspaceId)) {
				const tmpWorkspace = await giselleEngine.getWorkspace(
					tmpFlowTrigger.sdkWorkspaceId,
				);
				workspaceMap.set(tmpFlowTrigger.sdkWorkspaceId, tmpWorkspace);
			}

			const workspace = workspaceMap.get(tmpFlowTrigger.sdkWorkspaceId);
			if (workspace === undefined) {
				continue;
			}

			const node = workspace.nodes.find(
				(node) =>
					isTriggerNode(node) &&
					node.content.state.status === "configured" &&
					node.content.state.flowTriggerId === tmpFlowTrigger.sdkFlowTriggerId,
			);
			if (node === undefined) {
				continue;
			}

			const flowTrigger = await giselleEngine.getTrigger({
				flowTriggerId: tmpFlowTrigger.sdkFlowTriggerId,
			});
			if (flowTrigger === undefined) {
				continue;
			}

			// Apply history filter
			if (
				filterType === "history" &&
				!usedFlowTriggerIds.has(tmpFlowTrigger.sdkFlowTriggerId)
			) {
				continue;
			}

			flowTriggers.push({
				id: tmpFlowTrigger.sdkFlowTriggerId,
				teamId: team.id,
				label: node.name ?? defaultName(node),
				workspaceName: workspace.name ?? "Untitled",
				sdkData: flowTrigger,
			});
		}
	}

	return flowTriggers;
}
