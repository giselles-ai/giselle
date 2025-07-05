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

export const githubToolsFlag = flag<boolean>({
	key: "github-tools",
	async decide() {
		if (process.env.NODE_ENV === "development") {
			return takeLocalEnv("GITHUB_TOOLS_FLAG");
		}
		const edgeConfig = await get(`flag__${this.key}`);
		if (edgeConfig === undefined) {
			return true;
		}
		return edgeConfig === true || edgeConfig === "true";
	},
	description: "Enable GitHub Tools",
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
		try {
			const edgeConfig = await get(`flag__${this.key}`);
			if (edgeConfig === undefined) {
				return false;
			}
			return edgeConfig === true || edgeConfig === "true";
		} catch (error) {
			console.warn(
				"Edge Config not available, falling back to default:",
				error,
			);
			return false;
		}
	},
	description: "Enable Run v3",
	options: [
		{ value: false, label: "disable" },
		{ value: true, label: "Enable" },
	],
});

export const sidemenuFlag = flag<boolean>({
	key: "sidemenu",
	async decide() {
		if (process.env.NODE_ENV === "development") {
			return takeLocalEnv("SIDEMENU_FLAG");
		}
		try {
			const edgeConfig = await get(`flag__${this.key}`);
			if (edgeConfig === undefined) {
				return true;
			}
			return edgeConfig === true || edgeConfig === "true";
		} catch (error) {
			console.warn(
				"Edge Config not available, falling back to default:",
				error,
			);
			return true;
		}
	},
	description: "Enable Side Menu",
	options: [
		{ value: false, label: "disable" },
		{ value: true, label: "Enable" },
	],
});

export const layoutV2Flag = flag<boolean>({
	key: "layout-v2",
	async decide() {
		if (process.env.NODE_ENV === "development") {
			return takeLocalEnv("LAYOUT_V2_FLAG");
		}
		try {
			const edgeConfig = await get(`flag__${this.key}`);
			if (edgeConfig === undefined) {
				return true;
			}
			return edgeConfig === true || edgeConfig === "true";
		} catch (error) {
			console.warn(
				"Edge Config not available, falling back to default:",
				error,
			);
			return true;
		}
	},
	description: "Enable Layout V2",
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
		try {
			const edgeConfig = await get(`flag__${this.key}`);
			if (edgeConfig === undefined) {
				return false;
			}
			return edgeConfig === true || edgeConfig === "true";
		} catch (error) {
			console.warn(
				"Edge Config not available, falling back to default:",
				error,
			);
			return false;
		}
	},
	description: "Enable Layout V3",
	options: [
		{ value: false, label: "disable" },
		{ value: true, label: "Enable" },
	],
});
