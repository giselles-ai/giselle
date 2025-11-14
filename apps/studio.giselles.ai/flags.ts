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
			return true;
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

export const aiGatewayUnsupportedModelsFlag = flag<boolean>({
	key: "ai-gateway-unsupported-models",
	async decide() {
		if (process.env.NODE_ENV === "development") {
			return takeLocalEnv("AI_GATEWAY_UNSUPPORTED_MODELS_FLAG");
		}
		const edgeConfig = await get(`flag__${this.key}`);
		if (edgeConfig === undefined) {
			return false;
		}
		return edgeConfig === true || edgeConfig === "true";
	},
	description: "Allow unsupported AI Gateway models",
	options: [
		{ value: false, label: "disable" },
		{ value: true, label: "Enable" },
	],
	defaultValue: false,
});

export const googleUrlContextFlag = flag<boolean>({
	key: "google-url-context",
	async decide() {
		if (process.env.NODE_ENV === "development") {
			return takeLocalEnv("GOOGLE_URL_CONTEXT_FLAG");
		}
		const edgeConfig = await get(`flag__${this.key}`);
		if (edgeConfig === undefined) {
			return false;
		}
		return edgeConfig === true || edgeConfig === "true";
	},
	description: "Enable Google URL Context tool",
	options: [
		{ value: false, label: "disable" },
		{ value: true, label: "Enable" },
	],
	defaultValue: false,
});

export const newEditorFlag = flag<boolean>({
	key: "new-editor",
	async decide() {
		if (process.env.NODE_ENV === "development") {
			return takeLocalEnv("NEW_EDITOR_FLAG");
		}
		const edgeConfig = await get(`flag__${this.key}`);
		if (edgeConfig === undefined) {
			return false;
		}
		return edgeConfig === true || edgeConfig === "true";
	},
	description: "Enable new editor",
	options: [
		{ value: false, label: "disable" },
		{ value: true, label: "Enable" },
	],
});

export const githubIssuesVectorStoreFlag = flag<boolean>({
	key: "github-issues-vector-store",
	async decide() {
		if (process.env.NODE_ENV === "development") {
			return takeLocalEnv("GITHUB_ISSUES_VECTOR_STORE_FLAG");
		}
		const edgeConfig = await get(`flag__${this.key}`);
		if (edgeConfig === undefined) {
			return false;
		}
		return edgeConfig === true || edgeConfig === "true";
	},
	description: "Enable GitHub Issues vector store ingest",
	options: [
		{ value: false, label: "disable" },
		{ value: true, label: "Enable" },
	],
});
