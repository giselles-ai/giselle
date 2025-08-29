import { get } from "@vercel/edge-config";
import { flag } from "flags/next";

function takeLocalEnv(localEnvironmentKey: string) {
	if (process.env.NODE_ENV !== "development") {
		return false;
	}
	if (
		process.env[localEnvironmentKey] === undefined ||
		process.env[localEnvironmentKey] === "false"
	) {
		return false;
	}
	return true;
}

export const developerFlag = flag<boolean>({
	key: "developer",
	decide() {
		return takeLocalEnv("DEVELOPER_FLAG");
	},
	description: "Enable Developer",
	defaultValue: false,
	options: [
		{ value: false, label: "disable" },
		{ value: true, label: "Enable" },
	],
});

export const webSearchActionFlag = flag<boolean>({
	key: "web-search-action",
	decide() {
		return takeLocalEnv("WEB_SEARCH_ACTION_FLAG");
	},
	description: "Enable Web Search Action",
	defaultValue: false,
	options: [
		{ value: false, label: "disable" },
		{ value: true, label: "Enable" },
	],
});

export const runV3Flag = flag<boolean>({
	key: "run-v3",
	async decide() {
		if (process.env.NODE_ENV === "development") {
			return takeLocalEnv("RUN_V3_FLAG");
		}
		const edgeConfig = await get(`flag__${this.key}`);
		if (edgeConfig === undefined) {
			return false;
		}
		return edgeConfig === true || edgeConfig === "true";
	},
	description: "Enable Run v3",
	options: [
		{ value: false, label: "disable" },
		{ value: true, label: "Enable" },
	],
});

export const layoutV3Flag = flag<boolean>({
	key: "layout-v3",
	async decide() {
		if (process.env.NODE_ENV === "development") {
			return takeLocalEnv("LAYOUT_V3_FLAG");
		}
		const edgeConfig = await get(`flag__${this.key}`);
		if (edgeConfig === undefined) {
			return false;
		}
		return edgeConfig === true || edgeConfig === "true";
	},
	description: "Enable Layout V3",
	options: [
		{ value: false, label: "disable" },
		{ value: true, label: "Enable" },
	],
});

export const experimental_storageFlag = flag<boolean>({
	key: "experimental-storage",
	async decide() {
		if (process.env.NODE_ENV === "development") {
			return takeLocalEnv("EXPERIMENTAL_STORAGE_FLAG");
		}
		const edgeConfig = await get(`flag__${this.key}`);
		if (edgeConfig === undefined) {
			return false;
		}
		return edgeConfig === true || edgeConfig === "true";
	},
	description: "Enable experimental storage",
	options: [
		{ value: false, label: "disable" },
		{ value: true, label: "Enable" },
	],
});

export const stageFlag = flag<boolean>({
	key: "stage",
	async decide() {
		if (process.env.NODE_ENV === "development") {
			return takeLocalEnv("STAGE_FLAG");
		}
		const edgeConfig = await get(`flag__${this.key}`);
		if (edgeConfig === undefined) {
			return false;
		}
		return edgeConfig === true || edgeConfig === "true";
	},
	description: "Enable stage",
	options: [
		{ value: false, label: "disable" },
		{ value: true, label: "Enable" },
	],
});

export const multiEmbeddingFlag = flag<boolean>({
	key: "multi-embedding",
	async decide() {
		if (process.env.NODE_ENV === "development") {
			return takeLocalEnv("MULTI_EMBEDDING_FLAG");
		}
		const edgeConfig = await get(`flag__${this.key}`);
		if (edgeConfig === undefined) {
			return false;
		}
		return edgeConfig === true || edgeConfig === "true";
	},
	description: "Enable multiple embedding profiles",
	options: [
		{ value: false, label: "disable" },
		{ value: true, label: "Enable" },
	],
});

export const aiGatewayFlag = flag<boolean>({
	key: "ai-gateway",
	async decide() {
		if (process.env.NODE_ENV === "development") {
			return takeLocalEnv("AI_GATEWAY_FLAG");
		}
		const edgeConfig = await get(`flag__${this.key}`);
		if (edgeConfig === undefined) {
			return false;
		}
		return edgeConfig === true || edgeConfig === "true";
	},
	description: "Enable AI Gateway",
	options: [
		{ value: false, label: "disable" },
		{ value: true, label: "Enable" },
	],
});

export const resumableGenerationFlag = flag<boolean>({
	key: "resumable-generation",
	async decide() {
		if (process.env.NODE_ENV === "development") {
			return takeLocalEnv("RESUMABLE_GENERATION_FLAG");
		}
		const edgeConfig = await get(`flag__${this.key}`);
		if (edgeConfig === undefined) {
			return false;
		}
		return edgeConfig === true || edgeConfig === "true";
	},
	description: "Enable resumable generation",
	options: [
		{ value: false, label: "disable" },
		{ value: true, label: "Enable" },
	],
});

// Enable pointer-based retrieval with engine-side hydration (no rerank, no re-chunk)
export const ragPointerHydrationFlag = flag<boolean>({
	key: "rag-pointer-hydration",
	async decide() {
		if (process.env.NODE_ENV === "development") {
			return takeLocalEnv("RAG_POINTER_HYDRATION_FLAG");
		}
		const edgeConfig = await get(`flag__${this.key}`);
		if (edgeConfig === undefined) {
			return false;
		}
		return edgeConfig === true || edgeConfig === "true";
	},
	description: "Enable pointer-based retrieval + engine hydration",
	options: [
		{ value: false, label: "disable" },
		{ value: true, label: "Enable" },
	],
});
