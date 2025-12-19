"use client";

import type { Generation } from "@giselles-ai/protocol";
import { create } from "zustand";

type OpenedOutput = {
	id: string;
	title: string;
	generation: Generation;
	pathname: string;
};

type OutputDetailPaneState = {
	opened: OpenedOutput | null;
	open: (output: Omit<OpenedOutput, "pathname">) => void;
	close: () => void;
};

export const useOutputDetailPaneStore = create<OutputDetailPaneState>(
	(set) => ({
		opened: null,
		open: (output) =>
			set({
				opened: {
					...output,
					pathname: globalThis.location?.pathname ?? "",
				},
			}),
		close: () => set({ opened: null }),
	}),
);
