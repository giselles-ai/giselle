import {
	createEventHandler,
	type EmitterWebhookEvent,
	type EmitterWebhookEventName,
	Webhooks,
} from "@octokit/webhooks";
import { GitHubWebhookUnauthorizedError } from "./errors";

export type {
	EmitterWebhookEvent,
	EmitterWebhookEventName as WebhookEventName,
} from "@octokit/webhooks";

// biome-ignore lint/suspicious/noExplicitAny: Default generic parameter uses any for compatibility
export type WebhookEvent<T extends EmitterWebhookEventName = any> = {
	name: T;
	data: EmitterWebhookEvent<T>;
};

export function ensureWebhookEvent<T extends EmitterWebhookEventName>(
	event: WebhookEvent,
	expectedName: T,
): event is WebhookEvent<T> {
	return event.name === expectedName;
}

/**
 * Type guard that checks if an unknown value is a WebhookEvent
 */
export function isWebhookEvent(value: unknown): value is WebhookEvent {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	// Check if the object has the required properties
	const obj = value as Record<string, unknown>;
	return (
		"name" in obj &&
		typeof obj.name === "string" &&
		"data" in obj &&
		typeof obj.data === "object" &&
		obj.data !== null
	);
}

export async function verifyRequest({
	secret,
	request,
}: {
	secret: string;
	request: Request;
}) {
	const webhooks = new Webhooks({ secret });

	const signature = request.headers.get("x-hub-signature-256") ?? "";

	const body = await request.clone().text();

	const verified = await webhooks.verify(body, signature);

	if (!verified) {
		throw new GitHubWebhookUnauthorizedError();
	}
}

// Improved handler type using TypedWebhookEvent
type EventHandlers = {
	[K in EmitterWebhookEventName]: (event: WebhookEvent<K>) => Promise<void>;
};
export async function handleWebhook(args: {
	secret: string;
	request: Request;
	on: Partial<EventHandlers>;
}) {
	const eventHandler = createEventHandler({
		secret: args.secret,
	});
	const webhookEventNames = Object.keys(args.on) as EmitterWebhookEventName[];
	for (const webhookEventName of webhookEventNames) {
		eventHandler.on(webhookEventName, async (event) => {
			const _typedEvent = {
				name: webhookEventName,
				data: event,
			};

			await args.on[webhookEventName]?.({
				name: webhookEventName,
				data: event,
				// biome-ignore lint: lint/suspicious/noExplicitAny: Although type inference is broken, the implementation is type-safe
			} as any);
		});
	}

	await eventHandler.receive({
		id: args.request.headers.get("x-github-delivery") ?? "",
		// biome-ignore lint: lint/suspicious/noExplicitAny: Using 'any' is acceptable here as unexpected values won't cause issues
		name: args.request.headers.get("x-github-event") as any,
		payload: await args.request.clone().json(),
	});
}
