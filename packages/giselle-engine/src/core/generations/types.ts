import type { TelemetrySettings as AI_TelemetrySettings, ToolSet } from "ai";

export interface TelemetrySettings {
	metadata?: AI_TelemetrySettings["metadata"];
}

export type PreparedToolSet = {
	toolSet: ToolSet;
	cleanupFunctions: Array<() => void | Promise<void>>;
};
