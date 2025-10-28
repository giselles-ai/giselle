import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { giselleEngine } from "@/app/giselle-engine";
import { type acts as actsSchema, db } from "@/db";
import { stageFlag } from "@/flags";
import { fetchCurrentUser } from "@/services/accounts";
import { fetchUserTeams } from "@/services/teams";
import { FilterableActsList } from "./components/filterable-acts-list";
import type { ActWithNavigation } from "./types";

// The maximum duration of server actions on this page is extended to 800 seconds through enabled fluid compute.
// https://vercel.com/docs/functions/runtimes#max-duration
export const maxDuration = 800;

// This feature is currently under development and data structures change destructively,
// so parsing of legacy data frequently fails. We're using a rough try-catch to ignore
// data that fails to parse. This should be properly handled when the feature flag is removed.
async function enrichActWithNavigationData(
	act: typeof actsSchema.$inferSelect,
	teams: { dbId: number; name: string }[],
): Promise<ActWithNavigation | null> {
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

		// Extract LLM models from workspace nodes
		const llmModels: string[] = [];
		if (tmpWorkspace.nodes) {
			for (const node of tmpWorkspace.nodes) {
				if (node.content?.type === "textGeneration" && node.content.llm) {
					const model = node.content.llm.id;
					if (typeof model === "string" && !llmModels.includes(model)) {
						llmModels.push(model);
					}
				}
			}
		}

		return {
			id: tmpAct.id,
			status: tmpAct.status,
			createdAt: act.createdAt.toISOString(),
			link,
			teamName: team.name,
			workspaceName: tmpWorkspace.name ?? "Untitled",
			llmModels: llmModels.length > 0 ? llmModels : undefined,
			inputValues: undefined,
		};
	} catch {
		return null;
	}
}

async function reloadPage() {
	"use server";
	await Promise.resolve();
	revalidatePath("/stage/acts");
}

export default async function StageActsPage() {
	const enableStage = await stageFlag();
	if (!enableStage) {
		return notFound();
	}

	const teams = await fetchUserTeams();
	const user = await fetchCurrentUser();
	const dbActs = await db.query.acts.findMany({
		where: (acts, { eq }) => eq(acts.directorDbId, user.dbId),
		orderBy: (acts, { desc }) => [desc(acts.createdAt)],
		limit: 50,
	});

	const acts = await Promise.all(
		dbActs.map((dbAct) => enrichActWithNavigationData(dbAct, teams)),
	).then((tmp) =>
		tmp.filter(
			(actOrNull): actOrNull is ActWithNavigation => actOrNull !== null,
		),
	);

	return <FilterableActsList acts={acts} onReload={reloadPage} />;
}
