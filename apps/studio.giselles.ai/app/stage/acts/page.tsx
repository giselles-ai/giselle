import type { Act } from "@giselle-sdk/giselle";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

import { giselleEngine } from "@/app/giselle-engine";
import { type acts as actsSchema, db } from "@/drizzle";
import { stageFlag } from "@/flags";
import { fetchCurrentUser } from "@/services/accounts";
import { fetchUserTeams } from "@/services/teams";
import { FilterableActsList } from "./components/filterable-acts-list";

// The maximum duration of server actions on this page is extended to 800 seconds through enabled fluid compute.
// https://vercel.com/docs/functions/runtimes#max-duration
export const maxDuration = 800;

type ActWithNavigation = {
	id: string;
	status: "inProgress" | "completed" | "failed" | "cancelled";
	createdAt: string;
	workspaceName: string;
	teamName: string;
	link: string;
	llmModels?: string[];
	inputValues?: string;
};

// This feature is currently under development and data structures change destructively,
// so parsing of legacy data frequently fails. We're using a rough try-catch to ignore
// data that fails to parse. This should be properly handled when the feature flag is removed.
async function enrichActWithNavigationData(
	act: typeof actsSchema.$inferSelect,
	teams: { dbId: number; name: string }[],
): Promise<ActWithNavigation | null> {
	try {
		const tmpAct = await giselleEngine.getAct({ actId: act.sdkActId });
		console.log("DEBUG tmpAct:", JSON.stringify(tmpAct, null, 2));
		const team = teams.find((t) => t.dbId === act.teamDbId);
		if (team === undefined) {
			throw new Error("Team not found");
		}
		const tmpWorkspace = await giselleEngine.getWorkspace(
			act.sdkWorkspaceId,
			true,
		);
		console.log("DEBUG tmpWorkspace:", JSON.stringify(tmpWorkspace, null, 2));

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

		// Extract input values from act inputs
		console.log("DEBUG tmpAct properties:", Object.keys(tmpAct));
		console.log(
			"DEBUG tmpAct.inputs:",
			(tmpAct as unknown as { inputs?: unknown }).inputs,
		);

		let inputValues = "";
		try {
			// Check for various possible input properties
			interface ActWithInputs extends Act {
				inputs?: Array<{
					type: string;
					items?: Array<{ name: string; value: unknown }>;
				}>;
				parameters?:
					| Array<{ name?: string; key?: string; value: unknown }>
					| Record<string, unknown>;
				input?: string | Record<string, unknown>;
			}
			const actWithInputs = tmpAct as ActWithInputs;

			if (actWithInputs.inputs && Array.isArray(actWithInputs.inputs)) {
				console.log("DEBUG found inputs array:", actWithInputs.inputs);
				const parameterInputs = actWithInputs.inputs.find(
					(input) => input.type === "parameters" || input.type === "parameter",
				);
				if (parameterInputs?.items) {
					const values = parameterInputs.items.map(
						(item) => `${item.name}: ${item.value}`,
					);
					inputValues = values.join(", ");
				}
			} else if (actWithInputs.parameters) {
				console.log("DEBUG found parameters:", actWithInputs.parameters);
				if (Array.isArray(actWithInputs.parameters)) {
					const values = actWithInputs.parameters.map(
						(param) => `${param.name || param.key}: ${param.value}`,
					);
					inputValues = values.join(", ");
				} else if (typeof actWithInputs.parameters === "object") {
					const values = Object.entries(actWithInputs.parameters).map(
						([key, value]) => `${key}: ${value}`,
					);
					inputValues = values.join(", ");
				}
			} else if (actWithInputs.input) {
				console.log("DEBUG found input:", actWithInputs.input);
				if (typeof actWithInputs.input === "string") {
					inputValues = actWithInputs.input;
				} else if (typeof actWithInputs.input === "object") {
					const values = Object.entries(actWithInputs.input).map(
						([key, value]) => `${key}: ${value}`,
					);
					inputValues = values.join(", ");
				}
			}

			console.log("DEBUG extracted inputValues:", inputValues);
		} catch (error) {
			console.log("DEBUG error extracting inputs:", error);
		}

		return {
			id: tmpAct.id,
			status: tmpAct.status,
			createdAt: act.createdAt.toISOString(),
			link,
			teamName: team.name,
			workspaceName: tmpWorkspace.name ?? "Untitled",
			llmModels: llmModels.length > 0 ? llmModels : undefined,
			inputValues: inputValues || undefined,
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
