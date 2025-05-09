import type { z } from "zod";

export interface TriggerEventBase {
	id: string;
	label: string;
	description?: string;
	payloads?: z.AnyZodObject;
	conditions?: z.AnyZodObject;
}
export interface TriggerBase {
	provider: string;
	event: TriggerEventBase;
}

export interface ActionBase {
	provider: string;
	id: string;
	label: string;
	description?: string;
	parameters?: z.AnyZodObject;
}
