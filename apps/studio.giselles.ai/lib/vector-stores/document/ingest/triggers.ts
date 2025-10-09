import { createId } from "@paralleldrive/cuid2";
import type { UserId } from "@/drizzle";

type DocumentIngestTriggerId = `docing_${string}`;

export type DocumentIngestTrigger =
	| ({ type: "cron" } & { id: DocumentIngestTriggerId })
	| ({ type: "manual"; userId: UserId } & { id: DocumentIngestTriggerId });

function createDocumentIngestTriggerId(): DocumentIngestTriggerId {
	return `docing_${createId()}`;
}

export function createDocumentCronIngestTrigger(): DocumentIngestTrigger {
	return {
		id: createDocumentIngestTriggerId(),
		type: "cron",
	};
}

export function createDocumentManualIngestTrigger(
	userId: UserId,
): DocumentIngestTrigger {
	return {
		id: createDocumentIngestTriggerId(),
		type: "manual",
		userId,
	};
}
