"use client";

import { createContext, useContext, useRef } from "react";
import { useStore } from "zustand";
import type { StepsSectionData } from "./steps-section";
import {
	createStepsSectionStore,
	type StepsSectionStore,
	type StepsSectionStoreState,
} from "./steps-section-store";

const StepsSectionStoreContext = createContext<StepsSectionStore | null>(null);

export function StepsSectionStoreProvider({
	initialData,
	children,
}: {
	initialData: StepsSectionData;
	children: React.ReactNode;
}) {
	const storeRef = useRef<StepsSectionStore | null>(null);
	if (storeRef.current === null) {
		storeRef.current = createStepsSectionStore(initialData);
	}

	return (
		<StepsSectionStoreContext.Provider value={storeRef.current}>
			{children}
		</StepsSectionStoreContext.Provider>
	);
}

export function useStepsSectionStore<T>(
	selector: (state: StepsSectionStoreState) => T,
): T {
	const store = useContext(StepsSectionStoreContext);
	if (store === null) {
		throw new Error(
			"useStepsSectionStore must be used within StepsSectionStoreProvider",
		);
	}
	return useStore(store, selector);
}

