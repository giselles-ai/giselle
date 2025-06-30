import type { ZodRawShape, z } from "zod/v4";

export interface TriggerEvent {
	id: string;
	label: string;
	description?: string;
	payloads?: z.ZodObject<ZodRawShape>;
	conditions?: z.ZodObject<ZodRawShape>;
}
export interface TriggerBase {
	provider: string;
	event: TriggerEvent;
}

export interface ActionCommand {
	id: string;
	label: string;
	description?: string;
	parameters?: z.ZodObject<ZodRawShape>;
}

export interface ActionBase {
	provider: string;
	command: ActionCommand;
}
