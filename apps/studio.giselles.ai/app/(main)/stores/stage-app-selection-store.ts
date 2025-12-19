import { create } from "zustand";

export type StageAppSelectionScope = "playground" | "task";

type StageAppSelectionState = {
	selectedAppIdByScope: Record<StageAppSelectionScope, string | undefined>;
	setSelectedAppId: (
		scope: StageAppSelectionScope,
		appId: string | undefined,
	) => void;
	ensureSelectedAppId: (
		scope: StageAppSelectionScope,
		params: {
			availableAppIds: string[];
			preferredAppId?: string;
		},
	) => void;
};

const initialSelectedAppIdByScope: StageAppSelectionState["selectedAppIdByScope"] =
	{
		playground: undefined,
		task: undefined,
	};

function isValidAppId(appId: string | undefined, availableAppIds: string[]) {
	return appId !== undefined && availableAppIds.includes(appId);
}

export const useStageAppSelectionStore = create<StageAppSelectionState>(
	(set, get) => ({
		selectedAppIdByScope: initialSelectedAppIdByScope,
		setSelectedAppId: (scope, appId) => {
			set((state) => {
				const current = state.selectedAppIdByScope[scope];
				if (current === appId) {
					return state;
				}
				return {
					selectedAppIdByScope: {
						...state.selectedAppIdByScope,
						[scope]: appId,
					},
				};
			});
		},
		ensureSelectedAppId: (scope, { availableAppIds, preferredAppId }) => {
			const current = get().selectedAppIdByScope[scope];

			if (availableAppIds.length === 0) {
				if (current !== undefined) {
					set((state) => ({
						selectedAppIdByScope: {
							...state.selectedAppIdByScope,
							[scope]: undefined,
						},
					}));
				}
				return;
			}

			const nextSelectedAppId = isValidAppId(preferredAppId, availableAppIds)
				? preferredAppId
				: isValidAppId(current, availableAppIds)
					? current
					: availableAppIds[0];

			if (current === nextSelectedAppId) {
				return;
			}

			set((state) => ({
				selectedAppIdByScope: {
					...state.selectedAppIdByScope,
					[scope]: nextSelectedAppId,
				},
			}));
		},
	}),
);
