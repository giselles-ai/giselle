import type { UIMessage } from "ai";
import { create } from "zustand";
import {
	type Generation,
	isRunningGeneration,
} from "../../concepts/generation";
import type { GenerationId } from "../../concepts/identifiers";

interface GenerationStore {
	generations: Generation[];
	setGenerations: (generations: Generation[]) => void;
	addGenerationRunner: (generation: Generation | Generation[]) => void;
	updateGeneration: (generation: Generation) => void;
	updateMessages: (id: GenerationId, messages: UIMessage[]) => void;
	upsertMessage: (id: GenerationId, message: UIMessage) => void;
}

export const useGenerationStore = create<GenerationStore>((set) => ({
	generations: [],
	setGenerations: (generations) =>
		set({
			generations,
		}),
	addGenerationRunner: (generations) =>
		set((state) => {
			const arr = Array.isArray(generations) ? generations : [generations];
			return {
				generations: [...state.generations, ...arr],
			};
		}),
	updateGeneration: (generation) =>
		set((state) => ({
			generations: state.generations.map((g) =>
				g.id === generation.id ? generation : g,
			),
		})),
	updateMessages: (id, messages) =>
		set((state) => {
			return {
				generations: state.generations.map((g) =>
					g.id === id
						? {
								...g,
								messages,
							}
						: g,
				),
			};
		}),
	upsertMessage: (id, nextMessage) =>
		set((state) => {
			const targetGeneration = state.generations.find((g) => g.id === id);
			if (!isRunningGeneration(targetGeneration)) {
				return state;
			}
			const targetMessage = targetGeneration.messages.find(
				(m) => m.id === nextMessage.id,
			);

			const nextGeneration = {
				...targetGeneration,
				messages:
					targetMessage === undefined
						? [...targetGeneration.messages, nextMessage]
						: targetGeneration.messages.map((message) =>
								message.id === targetMessage.id ? nextMessage : message,
							),
			};
			return {
				generations: state.generations.map((g) =>
					g.id === id ? nextGeneration : g,
				),
			};
		}),
}));
