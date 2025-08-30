import {
	GitHubWebhookUnauthorizedError,
	verifyRequest as verifyRequestAsGitHubWebook,
} from "@giselle-sdk/github-tool";
import { after } from "next/server";
import { ZodError } from "zod";
import {
	GenerationId,
	GiselleEngine,
	type GiselleEngineConfig,
} from "../engine";
import {
	createFormDataRouters,
	createJsonRouters,
	type FormDataRouterHandlers,
	isFormDataRouterPath,
	isJsonRouterPath,
	type JsonRouterHandlers,
} from "../http";
import { type RequestContext, requestContextStore } from "./context";

interface NextGiselleEngineConfig extends GiselleEngineConfig {
	basePath: string;
	useAfterFunction?: boolean;
}

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

export function createHttpHandler({
	giselleEngine,
	config,
}: {
	giselleEngine: GiselleEngine;
	config: NextGiselleEngineConfig;
}) {
	const jsonRouter: JsonRouterHandlers = {} as JsonRouterHandlers;
	for (const [path, createRoute] of Object.entries(createJsonRouters)) {
		if (isJsonRouterPath(path)) {
			// @ts-expect-error
			jsonRouter[path] = createRoute(giselleEngine);
		}
	}

	const formDataRouter: FormDataRouterHandlers = {} as FormDataRouterHandlers;
	for (const [path, createRoute] of Object.entries(createFormDataRouters)) {
		if (isFormDataRouterPath(path)) {
			formDataRouter[path] = createRoute(giselleEngine);
		}
	}

	return async function httpHandler(request: Request) {
		let ctx: RequestContext | undefined;
		// Vercel sets the system env var `VERCEL` to "1" on all deployments
		// (builds/functions). This is the supported way to detect Vercel runtime.
		// Ref: Vercel Docs → System Environment Variables: VERCEL
		// https://vercel.com/docs/projects/environment-variables/system-environment-variables
		if (process.env.VERCEL === "1") {
			ctx = {
				// When on Vercel, `x-vercel-id` header can be used as a request correlation ID.
				// Ref: Vercel Docs → Request headers: x-vercel-id
				// https://vercel.com/docs/headers/request-headers#x-vercel-id
				requestId: request.headers.get("x-vercel-id") ?? undefined,
			};
		}
		return await requestContextStore.run(ctx, async () => {
			const url = new URL(request.url);
			const pathname = url.pathname;

			// Check if pathname matches /generations/{generationId}/generated-images/{filename}
			const generatedImageMatch = pathname.match(
				new RegExp(
					`^${config.basePath}/generations/([^/]+)/generated-images/([^/]+)$`,
				),
			);
			if (generatedImageMatch) {
				const generationId = generatedImageMatch[1];
				const filename = generatedImageMatch[2];
				const file = await giselleEngine.getGeneratedImage(
					GenerationId.parse(generationId),
					filename,
					false, // TODO: Get useExperimentalStorage from request parameters
				);
				return new Response(file, {
					headers: {
						"Content-Type": file.type,
						"Content-Disposition": `inline; filename="${file.name}"`,
					},
				});
			}

			const a = url.pathname.match(new RegExp(`^${config.basePath}(.+)`));

			const segmentString = a?.at(-1);
			if (segmentString == null)
				throw new Error(`Cannot parse action at ${pathname}`);
			const segments = segmentString
				.replace(/^\//, "")
				.split("/")
				.filter(Boolean);

			if (segments.length !== 1) {
				throw new Error(`Invalid action at ${pathname}`);
			}

			const [routerPath] = segments;

			if (config.useAfterFunction) {
				if (config.telemetry?.isEnabled && config.telemetry?.waitForFlushFn) {
					after(config.telemetry.waitForFlushFn);
				}

				// Flush generation index patches after response
				after(async () => {
					await giselleEngine.flushGenerationIndexQueue();
				});
			}

			if (isJsonRouterPath(routerPath)) {
				try {
					return await jsonRouter[routerPath]({
						// @ts-expect-error
						input: await getBody(request),
						signal: request.signal,
					});
				} catch (e) {
					if (e instanceof ZodError) {
						// @todo replace logger
						console.log(e.message);
						return new Response("Invalid request body", { status: 400 });
					}
					console.log(e);
					return new Response("Internal Server Error", { status: 500 });
				}
			}
			if (isFormDataRouterPath(routerPath)) {
				return await formDataRouter[routerPath]({
					// @ts-expect-error
					input: await getBody(request),
				});
			}
			/** Experimental implementation for handling webhooks with GiselleEngine */
			if (
				routerPath === "experimental_github-webhook" ||
				routerPath === "github-webhook"
			) {
				try {
					await verifyRequestAsGitHubWebook({
						secret:
							config.integrationConfigs?.github?.authV2.webhookSecret ?? "",
						request,
					});
				} catch (e) {
					if (GitHubWebhookUnauthorizedError.isInstance(e)) {
						return new Response("Unauthorized", { status: 401 });
					}
					return new Response("Internal Server Error", { status: 500 });
				}
				after(() => giselleEngine.handleGitHubWebhookV2({ request }));
				return new Response("Accepted", { status: 202 });
			}
			throw new Error(`Invalid router path at ${pathname}`);
		});
	};
}

export function NextGiselleEngine(config: NextGiselleEngineConfig) {
	const giselleEngine = GiselleEngine(config);
	const httpHandler = createHttpHandler({
		giselleEngine,
		config,
	});
	return {
		...giselleEngine,
		handlers: {
			GET: httpHandler,
			POST: httpHandler,
		},
	};
}
