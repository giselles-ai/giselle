import type { LLMProvider } from "@giselle-sdk/data-type";
import type { Storage } from "unstorage";
import { z } from "zod";
import { addGenerationHandler } from "./handlers/add-generation";
import { addRunHandler } from "./handlers/add-run";
import { cancelGenerationHandler } from "./handlers/cancel-generation";
import { createOpenAIVectorStoreHandler } from "./handlers/create-openai-vector-store";
import { createWorkspaceHandler } from "./handlers/create-workspace";
import { devHandler } from "./handlers/dev";
import { generateText } from "./handlers/generate-text";
import { getGenerationHandler } from "./handlers/get-generation";
import { getLLMProvidersHandler } from "./handlers/get-llm-providers";
import { getNodeGenerationsHandler } from "./handlers/get-node-generations";
import { getWorkspace } from "./handlers/get-workspace";
import { githubOperationHandler } from "./handlers/github-operation";
import { removeFileHandler } from "./handlers/remove-file";
import { saveWorkspace } from "./handlers/save-workspace";
import { startRunHandler } from "./handlers/start-run";
import { uploadFileHandler } from "./handlers/upload-file";
import type { GiselleEngineContext } from "./types";

export const GiselleEngineAction = z.enum([
	"create-workspace",
	"save-workspace",
	"get-workspace",
	"upload-file",
	"remove-file",
	"create-openai-vector-store",
	"get-llm-providers",
	"add-generation",
	"get-generation",
	"add-run",
	"start-run",
	"get-node-generations",
	"cancel-generation",
	"generate-text",
	"github-operation",
	"dev",
]);
type GiselleEngineAction = z.infer<typeof GiselleEngineAction>;

export interface GiselleEngineRequest {
	action: GiselleEngineAction;
	payload: unknown;
	context: GiselleEngineContext;
}

export interface GiselleEngineConfig {
	basePath: string;
	storage: Storage;
	llmProviders?: LLMProvider[];
}

async function toGiselleEngineRequest(
	request: Request,
	config: GiselleEngineConfig,
): Promise<GiselleEngineRequest> {
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

	const action = GiselleEngineAction.parse(unsafeAction);

	async function getBody(
		req: Request,
	): Promise<Record<string, unknown> | undefined> {
		if (!("body" in req) || !req.body || req.method !== "POST") return;

		const contentType = req.headers.get("content-type");
		if (contentType?.includes("application/json")) {
			const text = await req.text();
			if (text.length === 0) return;
			return JSON.parse(text);
		}
		if (contentType?.includes("application/x-www-form-urlencoded")) {
			const params = new URLSearchParams(await req.text());
			return Object.fromEntries(params);
		}
		if (contentType?.includes("multipart/form-data")) {
			const formData = await req.formData();
			const data = Object.fromEntries(formData.entries());
			return data;
		}
	}
	return {
		action,
		payload: request.body ? await getBody(request) : undefined,
		context: {
			storage: config.storage,
			llmProviders: config.llmProviders ?? ["openai"],
		},
	};
}

export async function GiselleEngine(
	request: Request,
	config: GiselleEngineConfig,
): Promise<Response> {
	const { action, payload, context } = await toGiselleEngineRequest(
		request,
		config,
	);
	switch (action) {
		case "save-workspace": {
			const result = await saveWorkspace({
				context,
				unsafeInput: payload,
			});
			return Response.json(result);
		}
		case "get-workspace": {
			const result = await getWorkspace({
				unsafeInput: payload,
				context,
			});
			return Response.json(result);
		}
		case "create-workspace": {
			const result = await createWorkspaceHandler({ context });
			return Response.json(result);
		}
		case "upload-file": {
			const result = await uploadFileHandler({ context, unsafeInput: payload });
			return Response.json(result);
		}
		case "remove-file": {
			await removeFileHandler({ context, unsafeInput: payload });
			return Response.json({ ok: true });
		}
		case "create-openai-vector-store": {
			const response = await createOpenAIVectorStoreHandler({
				context,
				unsafeInput: payload,
			});
			return Response.json(response);
		}
		case "get-llm-providers": {
			const response = await getLLMProvidersHandler({
				context,
			});
			return Response.json(response);
		}
		case "add-generation": {
			const response = await addGenerationHandler({
				context,
				unsafeInput: payload,
			});
			return Response.json(response);
		}

		case "get-generation": {
			const response = await getGenerationHandler({
				context,
				unsafeInput: payload,
			});
			return Response.json(response);
		}
		case "add-run": {
			const response = await addRunHandler({
				context,
				unsafeInput: payload,
			});
			return Response.json(response);
		}
		case "start-run": {
			await startRunHandler({
				context,
				unsafeInput: payload,
			});
			return Response.json({ ok: true });
		}
		case "get-node-generations": {
			const response = await getNodeGenerationsHandler({
				context,
				unsafeInput: payload,
			});
			return Response.json(response);
		}
		case "cancel-generation": {
			await cancelGenerationHandler({
				context,
				unsafeInput: payload,
			});
			return Response.json({ ok: true });
		}
		case "dev": {
			const res = await devHandler({ context });
			return Response.json(res);
		}
		case "github-operation": {
			const response = await githubOperationHandler({
				context,
				unsafeInput: payload,
			});
			return Response.json(response);
		}
		case "generate-text": {
			return await generateText({
				context,
				input: payload,
			});
		}
		default: {
			const _exhaustiveCheck: never = action;
			return _exhaustiveCheck;
		}
	}
}
