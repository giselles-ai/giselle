"use client";

import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import type { StageApp } from "../playground/types";

type StageAppSelectionState = {
	selectedAppId: string | undefined;
	setSelectedAppId: (appId: string | undefined) => void;
};

function isValidAppId(appId: string | undefined, availableAppIds: string[]) {
	return appId !== undefined && availableAppIds.includes(appId);
}

const StageAppSelectionContext = createContext<StageAppSelectionState | null>(
	null,
);

export function StageAppSelectionProvider({
	children,
	initialSelectedAppId,
}: {
	children: React.ReactNode;
	initialSelectedAppId?: string;
}) {
	const [selectedAppId, setSelectedAppIdState] = useState<string | undefined>(
		initialSelectedAppId,
	);

	const setSelectedAppId = useCallback((appId: string | undefined) => {
		setSelectedAppIdState((prev) => (prev === appId ? prev : appId));
	}, []);

	const value = useMemo(
		() => ({
			selectedAppId,
			setSelectedAppId,
		}),
		[selectedAppId, setSelectedAppId],
	);

	return (
		<StageAppSelectionContext.Provider value={value}>
			{children}
		</StageAppSelectionContext.Provider>
	);
}

function useStageAppSelection() {
	const ctx = useContext(StageAppSelectionContext);
	if (!ctx) {
		throw new Error("StageAppSelectionProvider is missing.");
	}
	return ctx;
}

export function useSelectedStageApp(
	/** @todo type location is wrong */
	apps: StageApp[],
) {
	const { selectedAppId, setSelectedAppId } = useStageAppSelection();

	const availableAppIds = useMemo(() => apps.map((app) => app.id), [apps]);

	const effectiveSelectedAppId = useMemo(
		() =>
			isValidAppId(selectedAppId, availableAppIds)
				? selectedAppId
				: availableAppIds[0],
		[availableAppIds, selectedAppId],
	);

	const selectedApp = useMemo(() => {
		if (!effectiveSelectedAppId) return undefined;
		return apps.find((app) => app.id === effectiveSelectedAppId);
	}, [apps, effectiveSelectedAppId]);

	return {
		selectedAppId: effectiveSelectedAppId,
		selectedApp,
		setSelectedAppId,
	} as const;
}
