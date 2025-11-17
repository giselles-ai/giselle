import { Task, type TaskId } from "@giselles-ai/protocol";
import { taskPath } from "../path";
import type { GiselleContext } from "../types";
import { type Patch, patchAct as patchActObject } from "./object/patch-object";

export type { Patch };

export async function patchAct(args: {
	context: GiselleContext;
	actId: TaskId;
	patches: Patch[];
}) {
	// Get the current act
	const currentAct = await args.context.storage.getJson({
		path: taskPath(args.actId),
		schema: Task,
	});

	// Always update the updatedAt field
	const allPatches: Patch[] = [
		...args.patches,
		{ path: "updatedAt", set: Date.now() },
	];

	// Apply the patches
	const updatedAct = patchActObject(currentAct, ...allPatches);

	await args.context.storage.setJson({
		path: taskPath(args.actId),
		data: updatedAct,
	});

	return updatedAct;
}
