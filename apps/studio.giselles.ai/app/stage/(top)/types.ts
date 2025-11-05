import type { ParameterItem } from "@giselles-ai/giselle";
import type { FlowTrigger, FlowTriggerId } from "@giselles-ai/protocol";
import type { InferSelectModel } from "drizzle-orm";
import type { teams } from "@/db";

// Team related types
export type TeamId = InferSelectModel<typeof teams>["id"];

export interface TeamOption {
	value: TeamId;
	label: string;
	avatarUrl?: string;
}

// Filter related types
export type FilterType = "all" | "history" | "latest" | "favorites";

// Flow trigger related types
export interface FlowTriggerUIItem {
	id: FlowTriggerId;
	teamId: TeamId;
	workspaceName: string;
	label: string;
	sdkData: FlowTrigger;
}

// Form input types
export interface FormInput {
	name: string;
	label: string;
	type: "text" | "multiline-text" | "number";
	required: boolean;
}

// Action types
export interface PerformStagePayloads {
	teamId: TeamId;
	flowTrigger: FlowTrigger;
	parameterItems: ParameterItem[];
}

export type PerformStageAction = (
	payloads: PerformStagePayloads,
) => Promise<void>;

// UI state types
export interface ValidationErrors {
	[key: string]: string;
}

export interface FormValues {
	[key: string]: string | number;
}
