import type { Act } from "@giselles-ai/protocol";
import * as z from "zod/v4";
import type { OnGenerationComplete, OnGenerationError } from "../generations";
import type { GiselleContext } from "../types";
import { CreateActInputs, createAct } from "./create-act";
import { type RunActCallbacks, runAct } from "./run-act";
import { StartActInputs } from "./start-act";

interface CreateAndStartActCallbacks extends RunActCallbacks {
	actCreate?: (args: { act: Act }) => void | Promise<void>;
	generationComplete?: OnGenerationComplete;
	generationError?: OnGenerationError;
}

export const CreateAndStartActInputs = z.object({
	...CreateActInputs.shape,
	...StartActInputs.omit({ actId: true }).shape,
	...z.object({
		callbacks: z.optional(z.custom<CreateAndStartActCallbacks>()),
	}).shape,
});
export type CreateAndStartActInputs = z.infer<typeof CreateAndStartActInputs>;

/** @todo telemetry */
export async function createAndStartAct(
	args: CreateAndStartActInputs & {
		context: GiselleContext;
	},
) {
	const { act } = await createAct(args);
	await args.callbacks?.actCreate?.({ act });
	await runAct({
		context: args.context,
		actId: act.id,
		callbacks: args.callbacks,
	});
}
