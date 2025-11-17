import type { Task } from "@giselles-ai/protocol";
import { create } from "zustand";

interface TaskStore {
	activeTask: Task | undefined;
	creating: boolean;
	setActiveTask: (task: Task | undefined) => void;
	setCreating: (creating: boolean) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
	activeTask: undefined,
	creating: false,
	setActiveTask: (task: Task | undefined) => {
		set({ activeTask: task });
	},
	setCreating: (creating: boolean) => {
		set({ creating });
	},
}));
