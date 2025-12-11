import type { ParametersInput, WorkspaceId } from "@giselles-ai/protocol";
import { create } from "zustand";

type OverlayAppSummary = {
	name: string;
	description?: string | null;
	workspaceId: WorkspaceId;
};

type TaskOverlayState = {
	isVisible: boolean;
	overlayApp: OverlayAppSummary | null;
	overlayInput: ParametersInput | null;
	showOverlay: (payload: {
		app: OverlayAppSummary;
		input?: ParametersInput | null;
	}) => void;
	hideOverlay: () => void;
};

const initialState: Pick<
	TaskOverlayState,
	"isVisible" | "overlayApp" | "overlayInput"
> = {
	isVisible: false,
	overlayApp: null,
	overlayInput: null,
};

export const useTaskOverlayStore = create<TaskOverlayState>((set) => ({
	...initialState,
	showOverlay: ({ app, input = null }) =>
		set({
			isVisible: true,
			overlayApp: app,
			overlayInput: input,
		}),
	hideOverlay: () => set({ ...initialState }),
}));
