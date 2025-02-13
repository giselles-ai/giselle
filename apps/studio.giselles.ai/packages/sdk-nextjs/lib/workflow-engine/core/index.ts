import type { WorkflowDataJson } from "@/lib/workflow-data";
import type { Storage } from "unstorage";
import { z } from "zod";
import { createWorkflow } from "./handlers/create-workflow";
import { getWorkflow } from "./handlers/get-workflow";
import { saveWorkflow } from "./handlers/save-workflow";
import { textGeneration } from "./handlers/text-generation";
import type { WorkflowEngineContext } from "./types";

export const WorkflowEngineAction = z.enum([
	"create-workflow",
	"save-workflow",
	"get-workflow",
	"text-generation",
]);
type WorkflowEngineAction = z.infer<typeof WorkflowEngineAction>;

export interface WorkflowEngineRequest {
	action: WorkflowEngineAction;
	payload: unknown;
	context: WorkflowEngineContext;
}

export interface WorkflowEngineConfig {
	basePath: string;
	storage: Storage<WorkflowDataJson>;
}

async function toWorkflowEngineRequest(
	request: Request,
	config: WorkflowEngineConfig,
): Promise<WorkflowEngineRequest> {
	request.url;
	const url = new URL(request.url);
	const pathname = url.pathname;
	const a = url.pathname.match(new RegExp(`^${config.basePath}(.+)`));

	const segmentString = a?.at(-1);
	if (segmentString == null)
		throw new Error(`Cannot parse action at ${pathname}`);
	const segments = segmentString.replace(/^\//, "").split("/").filter(Boolean);

	if (segments.length !== 1) {
		throw new Error(`Invalid action at ${pathname}`);
	}

	const [unsafeAction] = segments;

	const action = WorkflowEngineAction.parse(unsafeAction);

	async function getBody(
		req: Request,
	): Promise<Record<string, unknown> | undefined> {
		if (!("body" in req) || !req.body || req.method !== "POST") return;

		const contentType = req.headers.get("content-type");
		if (contentType?.includes("application/json")) {
			return await req.json();
		}
		if (contentType?.includes("application/x-www-form-urlencoded")) {
			const params = new URLSearchParams(await req.text());
			return Object.fromEntries(params);
		}
	}
	return {
		action,
		payload: request.body ? await getBody(request) : undefined,
		context: {
			storage: config.storage,
		},
	};
}

export async function WorkflowEngine(
	request: Request,
	config: WorkflowEngineConfig,
): Promise<Response> {
	const { action, payload, context } = await toWorkflowEngineRequest(
		request,
		config,
	);
	switch (action) {
		case "save-workflow": {
			const result = await saveWorkflow({
				context,
				unsafeInput: payload,
			});
			return Response.json(result);
		}
		case "get-workflow": {
			const result = await getWorkflow({
				unsafeInput: payload,
				context,
			});
			return Response.json(result);
		}
		case "text-generation": {
			const stream = await textGeneration({
				context,
				unsafeInput: payload,
			});
			return stream.toDataStreamResponse();
		}
		case "create-workflow": {
			const result = await createWorkflow({ context });
			return Response.json(result);
		}
		default: {
			const _exhaustiveCheck: never = action;
			return _exhaustiveCheck;
		}
	}
}
