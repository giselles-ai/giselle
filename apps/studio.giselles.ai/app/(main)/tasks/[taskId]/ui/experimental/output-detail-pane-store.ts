"use client";

import type { Generation } from "@giselles-ai/protocol";
import { create } from "zustand";

type OpenedOutput = {
	id: string;
	title: string;
	generation: Generation;
};

type OutputDetailPaneState = {
	opened: OpenedOutput | null;
	open: (output: OpenedOutput) => void;
	close: () => void;
};

export const useOutputDetailPaneStore = create<OutputDetailPaneState>(
	(set) => ({
		opened: null,
		open: (output) => set({ opened: output }),
		close: () => set({ opened: null }),
	}),
);
