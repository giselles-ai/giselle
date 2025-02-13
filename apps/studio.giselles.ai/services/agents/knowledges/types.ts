import { custom } from "valibot";

export type KnowledgeId = `knwl_${string}`;
export const knowledgeIdSchema = custom<KnowledgeId>(
	(input) => typeof input === "string" && /^knwl_.*$/.test(input),
);

export type KnowledgeContentId = `knwl.cnt_${string}`;
export type FileId = `fl_${string}`;

export type File = {
	id: FileId;
};

export const knowledgeContentType = {
	file: "file",
	text: "text",
	markdown: "markdown",
} as const;

export type KnowledgeContentType =
	(typeof knowledgeContentType)[keyof typeof knowledgeContentType];

export const knowledgeContentStatus = {
	inProgress: "in_progress",
	completed: "completed",
	cancelled: "cancelled",
	failed: "failed",
} as const;
type KnowledgeContentStatus =
	(typeof knowledgeContentStatus)[keyof typeof knowledgeContentStatus];

export type KnowledgeContent = {
	id: KnowledgeContentId;
	name: string;
	status: KnowledgeContentStatus;
};

export type Knowledge = {
	id: KnowledgeId;
	name: string;
	contents: KnowledgeContent[];
};

export type KnowledgeState = {
	knowledges: Knowledge[];
	isLoading: boolean;
};
