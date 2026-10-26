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
	decide() {
		return process.env.LAYOUT_V3_FLAG === "true";
	},
	description: "Enable Layout V3",
	options: [
		{ value: false, label: "disable" },
		{ value: true, label: "Enable" },
	],
});

export const experimental_storageFlag = flag<boolean>({
	key: "experimental-storage",
	decide() {
		return process.env.EXPERIMENTAL_STORAGE_FLAG === undefined
			? process.env.NODE_ENV !== "development"
			: process.env.EXPERIMENTAL_STORAGE_FLAG === "true";
	},
	description: "Enable experimental storage",
	options: [
		{ value: false, label: "disable" },
		{ value: true, label: "Enable" },
	],
});

export const stageV2Flag = flag<boolean>({
	key: "stage-v2",
	decide() {
		return process.env.STAGE_V2_FLAG === "true";
	},
	description: "Enable stage showcase (Apps page)",
	options: [
		{ value: false, label: "disable" },
		{ value: true, label: "Enable" },
	],
});

export const aiGatewayFlag = flag<boolean>({
	key: "ai-gateway",
	decide() {
		return process.env.AI_GATEWAY_FLAG === "true";
	},
	description: "Enable AI Gateway",
	options: [
		{ value: false, label: "disable" },
		{ value: true, label: "Enable" },
	],
});

export const aiGatewayUnsupportedModelsFlag = flag<boolean>({
	key: "ai-gateway-unsupported-models",
	decide() {
		return process.env.AI_GATEWAY_UNSUPPORTED_MODELS_FLAG === "true";
	},
	description: "Allow unsupported AI Gateway models",
	options: [
		{ value: false, label: "disable" },
		{ value: true, label: "Enable" },
	],
	defaultValue: false,
});

export const newEditorFlag = flag<boolean>({
	key: "new-editor",
	decide() {
		return process.env.NEW_EDITOR_FLAG === "true";
	},
	description: "Enable new editor",
	options: [
		{ value: false, label: "disable" },
		{ value: true, label: "Enable" },
	],
});

export const generateContentNodeFlag = flag<boolean>({
	key: "generate-content-node",
	decide() {
		return process.env.GENERATE_CONTENT_NODE_FLAG === "true";
	},
	description: "Enable generate content node",
	options: [
		{ value: false, label: "disable" },
		{ value: true, label: "Enable" },
	],
});

export const privatePreviewToolsFlag = flag<boolean>({
	key: "private-preview-tools",
	decide() {
		return process.env.PRIVATE_PREVIEW_TOOLS_FLAG === "true";
	},
	description: "Enable private preview tools (PostgreSQL, etc.)",
	options: [
		{ value: false, label: "disable" },
		{ value: true, label: "Enable" },
	],
	defaultValue: false,
});
