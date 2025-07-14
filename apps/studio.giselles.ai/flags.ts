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

export const sidemenuFlag = flag<boolean>({
	key: "sidemenu",
	async decide() {
		if (process.env.NODE_ENV === "development") {
			return takeLocalEnv("SIDEMENU_FLAG");
		}
		const edgeConfig = await get(`flag__${this.key}`);
		if (edgeConfig === undefined) {
			return true;
		}
		return edgeConfig === true || edgeConfig === "true";
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
		const edgeConfig = await get(`flag__${this.key}`);
		if (edgeConfig === undefined) {
			return true;
		}
		return edgeConfig === true || edgeConfig === "true";
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

export const stripeBasilMigrationFlag = flag<boolean>({
	key: "stripe-basil-migration",
	async decide() {
		if (process.env.NODE_ENV === "development") {
			return takeLocalEnv("STRIPE_BASIL_MIGRATION_FLAG");
		}
		const edgeConfig = await get(`flag__${this.key}`);
		if (edgeConfig === undefined) {
			return false;
		}
		return edgeConfig === true || edgeConfig === "true";
	},
	description: "Enable Stripe Basil API Migration",
	defaultValue: false,
	options: [
		{ value: false, label: "Acacia (Current)" },
		{ value: true, label: "Basil (New)" },
	],
});
