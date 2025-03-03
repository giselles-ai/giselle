import type { CancelledGeneration } from "@giselle-sdk/data-type";
import type { z } from "zod";
import {
	getGeneration,
	setGeneration,
	setNodeGenerationIndex,
} from "../helpers";
import { cancelGeneration } from "../schema";
import type { GiselleEngineHandlerArgs } from "./types";

const Input = cancelGeneration.Input;
type Input = z.infer<typeof Input>;

export async function cancelGenerationHandler({
	context,
	unsafeInput,
}: GiselleEngineHandlerArgs<Input>) {
	const input = Input.parse(unsafeInput);
	const generation = await getGeneration({
		storage: context.storage,
		generationId: input.generationId,
	});
	if (generation === undefined) {
		throw new Error(`Generation ${input.generationId} not found`);
	}
	await Promise.all([
		setGeneration({
			storage: context.storage,
			generation: {
				...generation,
				status: "cancelled",
				cancelledAt: Date.now(),
			} as CancelledGeneration,
		}),
		setNodeGenerationIndex({
			storage: context.storage,
			nodeId: generation.context.actionNode.id,
			origin: generation.context.origin,
			nodeGenerationIndex: {
				id: generation.id,
				nodeId: generation.context.actionNode.id,
				status: "cancelled",
				createdAt: generation.createdAt,
				/** @todo use generation.ququedAt */
				ququedAt: Date.now(),
				cancelledAt: Date.now(),
			},
		}),
	]);
}
