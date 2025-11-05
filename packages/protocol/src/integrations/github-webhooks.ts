import type {
	EmitterWebhookEvent,
	EmitterWebhookEventName,
} from "@octokit/webhooks";

// biome-ignore lint/suspicious/noExplicitAny: Default generic parameter uses any for compatibility
export type WebhookEvent<T extends EmitterWebhookEventName = any> = {
	name: T;
	data: EmitterWebhookEvent<T>;
};
