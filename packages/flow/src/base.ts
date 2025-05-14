import type { z } from "zod";

export interface TriggerEvent {
	id: string;
	label: string;
	description?: string;
	payloads?: z.AnyZodObject;
	conditions?: z.AnyZodObject;
}
export interface TriggerBase {
	provider: string;
	event: TriggerEvent;
}

export interface ActionCommand {
	id: string;
	label: string;
	description?: string;
	parameters?: z.AnyZodObject;
}

export interface ActionBase {
	provider: string;
	command: ActionCommand;
}
