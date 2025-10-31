import type { z } from "zod/v4";

interface TriggerEvent {
	id: string;
	label: string;
	description?: string;
	payloads?: z.ZodObject;
	conditions?: z.ZodObject;
}
export interface TriggerBase {
	provider: string;
	event: TriggerEvent;
}

interface ActionCommand {
	id: string;
	label: string;
	description?: string;
	parameters?: z.ZodObject;
}

export interface ActionBase {
	provider: string;
	command: ActionCommand;
}
