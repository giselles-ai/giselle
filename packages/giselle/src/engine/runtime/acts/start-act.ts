import { ActId, GenerationOrigin } from "@giselles-ai/protocol";
import * as z from "zod/v4";
import type { GiselleEngineContext } from "../../contracts";
import { getAct } from "./get-act";
import { patches } from "./object/patch-creators";
import { patchAct } from "./patch-act";
import { runAct } from "./run-act";

export const StartActInputs = z.object({
	actId: ActId.schema,
	generationOriginType: z.enum(
		GenerationOrigin.options.map((option) => option.shape.type.value),
	),
});
export type StartActInputs = z.infer<typeof StartActInputs>;

export async function startAct({
	actId,
	context,
	generationOriginType,
}: StartActInputs & {
	context: GiselleEngineContext;
}) {
	const act = await getAct({ context, actId });

	if (act.status !== "created") {
		throw new Error(`Act ${actId} is not in the created state`);
	}

	await patchAct({
		context,
		actId,
		patches: [patches.status.set("inProgress")],
	});

	switch (context.runActProcess.type) {
		case "self":
			context.waitUntil(async () => await runAct({ context, actId }));
			break;
		case "external":
			await context.runActProcess.process({
				context,
				act,
				generationOriginType,
			});
			break;
		default: {
			const _exhaustiveCheck: never = context.runActProcess;
			throw new Error(`Unhandled runActProcess type: ${_exhaustiveCheck}`);
		}
	}
}
