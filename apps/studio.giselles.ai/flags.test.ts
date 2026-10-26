import { afterEach, describe, expect, test, vi } from "vitest";
import * as flags from "./flags";

vi.mock("flags/next", () => ({
	flag: (definition: { decide: () => boolean }) => definition.decide,
}));

afterEach(() => vi.unstubAllEnvs());

const migratedFlags = [
	["LAYOUT_V3_FLAG", flags.layoutV3Flag],
	["STAGE_V2_FLAG", flags.stageV2Flag],
	["AI_GATEWAY_FLAG", flags.aiGatewayFlag],
	["AI_GATEWAY_UNSUPPORTED_MODELS_FLAG", flags.aiGatewayUnsupportedModelsFlag],
	["NEW_EDITOR_FLAG", flags.newEditorFlag],
	["GENERATE_CONTENT_NODE_FLAG", flags.generateContentNodeFlag],
	["PRIVATE_PREVIEW_TOOLS_FLAG", flags.privatePreviewToolsFlag],
] as const;

describe.each(["development", "production"] as const)("%s flags", (mode) => {
	test.each(migratedFlags)(
		"%s uses explicit true without Edge Config",
		async (name, flag) => {
			vi.stubEnv("NODE_ENV", mode);
			vi.stubEnv("EDGE_CONFIG", undefined);
			for (const value of [undefined, "false", "", "0", "TRUE", "true"]) {
				vi.stubEnv(name, value);
				expect(await flag()).toBe(value === "true");
			}
		},
	);

	test("preserves the storage default and supports explicit overrides", async () => {
		vi.stubEnv("NODE_ENV", mode);
		vi.stubEnv("EXPERIMENTAL_STORAGE_FLAG", undefined);
		expect(await flags.experimental_storageFlag()).toBe(mode !== "development");
		vi.stubEnv("EXPERIMENTAL_STORAGE_FLAG", "false");
		expect(await flags.experimental_storageFlag()).toBe(false);
		vi.stubEnv("EXPERIMENTAL_STORAGE_FLAG", "true");
		expect(await flags.experimental_storageFlag()).toBe(true);
	});

	test("keeps development-only flags restricted to development", async () => {
		vi.stubEnv("NODE_ENV", mode);
		vi.stubEnv("DEVELOPER_FLAG", "true");
		vi.stubEnv("WEB_SEARCH_ACTION_FLAG", "true");
		expect(await flags.developerFlag()).toBe(mode === "development");
		expect(await flags.webSearchActionFlag()).toBe(mode === "development");
	});
});
