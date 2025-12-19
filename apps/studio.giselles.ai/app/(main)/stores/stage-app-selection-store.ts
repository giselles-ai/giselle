"use client";

import { useCallback, useEffect, useMemo } from "react";
import { create } from "zustand";
import { useShallow } from "zustand/shallow";

export type StageAppSelectionScope = "playground" | "task";

export type StageAppSelectable = {
	id: string;
};

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

export function useSelectedStageApp<TApp extends StageAppSelectable>(
	scope: StageAppSelectionScope,
	apps: TApp[],
	params?: {
		preferredAppId?: string;
	},
) {
	const { selectedAppId, setSelectedAppId, ensureSelectedAppId } =
		useStageAppSelectionStore(
			useShallow((state) => ({
				selectedAppId: state.selectedAppIdByScope[scope],
				setSelectedAppId: state.setSelectedAppId,
				ensureSelectedAppId: state.ensureSelectedAppId,
			})),
		);

	const availableAppIds = useMemo(() => apps.map((app) => app.id), [apps]);

	const effectiveSelectedAppId = useMemo(() => {
		if (isValidAppId(selectedAppId, availableAppIds)) {
			return selectedAppId;
		}

		if (isValidAppId(params?.preferredAppId, availableAppIds)) {
			return params?.preferredAppId;
		}

		return availableAppIds[0];
	}, [availableAppIds, params?.preferredAppId, selectedAppId]);

	useEffect(() => {
		const shouldApplyPreferred =
			selectedAppId === undefined ||
			!isValidAppId(selectedAppId, availableAppIds);

		ensureSelectedAppId(scope, {
			availableAppIds,
			preferredAppId: shouldApplyPreferred ? params?.preferredAppId : undefined,
		});
	}, [
		availableAppIds,
		ensureSelectedAppId,
		params?.preferredAppId,
		scope,
		selectedAppId,
	]);

	const selectedApp = useMemo(() => {
		if (!effectiveSelectedAppId) return undefined;
		return apps.find((app) => app.id === effectiveSelectedAppId);
	}, [apps, effectiveSelectedAppId]);

	const setSelectedAppIdForScope = useCallback(
		(appId: string | undefined) => {
			setSelectedAppId(scope, appId);
		},
		[scope, setSelectedAppId],
	);

	return {
		selectedAppId: effectiveSelectedAppId,
		selectedApp,
		setSelectedAppId: setSelectedAppIdForScope,
	} as const;
}
