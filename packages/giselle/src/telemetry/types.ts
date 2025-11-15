import type { TelemetrySettings as AI_TelemetrySettings } from "ai";

export interface TelemetrySettings {
	metadata?: AI_TelemetrySettings["metadata"];
}
