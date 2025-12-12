"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { StepsSectionData } from "./steps-section-data";

interface StepsSectionContextValue {
	data: StepsSectionData;
	isPolling: boolean;
}

const StepsSectionContext = createContext<StepsSectionContextValue | null>(
	null,
);

export function StepsSectionProvider({
	initial,
	children,
	refreshAction,
}: {
	initial: StepsSectionData;
	children: React.ReactNode;
	refreshAction: () => Promise<StepsSectionData>;
}) {
	const [data, setData] = useState<StepsSectionData>(initial);
	const [isPolling, setIsPolling] = useState(false);
	const initializedRef = useRef(false);

	useEffect(() => {
		if (initializedRef.current) {
			return;
		}
		initializedRef.current = true;

		let cancelled = false;
		let timer: number | null = null;

		async function tick() {
			if (cancelled) {
				return;
			}

			setIsPolling(true);
			const latest = await refreshAction();
			if (!cancelled) {
				setData(latest);
			}

			if (
				latest.status === "completed" ||
				latest.status === "failed" ||
				latest.status === "cancelled"
			) {
				return;
			}

			timer = window.setTimeout(tick, 1500);
		}

		if (
			initial.status !== "completed" &&
			initial.status !== "failed" &&
			initial.status !== "cancelled"
		) {
			timer = window.setTimeout(tick, 1500);
		}

		return () => {
			cancelled = true;
			if (timer) window.clearTimeout(timer);
			setIsPolling(false);
		};
	}, [initial, refreshAction]);

	return (
		<StepsSectionContext.Provider value={{ data, isPolling }}>
			{children}
		</StepsSectionContext.Provider>
	);
}

export function useStepsSection() {
	const ctx = useContext(StepsSectionContext);
	if (!ctx) {
		throw new Error("useTaskProgress must be used within TaskProgressProvider");
	}
	return ctx;
}
