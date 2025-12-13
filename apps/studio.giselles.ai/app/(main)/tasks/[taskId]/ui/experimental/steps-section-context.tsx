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

const isDebugEnabled = process.env.NODE_ENV !== "production";

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
	const refreshActionRef = useRef(refreshAction);

	useEffect(() => {
		refreshActionRef.current = refreshAction;
	}, [refreshAction]);

	useEffect(() => {
		let cancelled = false;
		let timer: number | null = null;

		async function tick() {
			if (cancelled) {
				if (isDebugEnabled) {
					console.debug("[steps-section] tick aborted (cancelled)");
				}
				return;
			}

			if (isDebugEnabled) {
				console.debug("[steps-section] tick start");
			}

			setIsPolling(true);
			let latest: StepsSectionData | null = null;
			try {
				latest = await refreshActionRef.current();
				if (isDebugEnabled) {
					console.debug("[steps-section] refreshAction resolved", {
						status: latest.status,
					});
				}

				if (!cancelled) {
					setData(latest);
				}
			} catch (error) {
				if (isDebugEnabled) {
					console.debug("[steps-section] refreshAction failed", error);
				}
				// Keep polling even if refresh fails (useful while debugging).
				if (!cancelled) {
					timer = window.setTimeout(tick, 3000);
				}
				return;
			} finally {
				if (!cancelled) {
					setIsPolling(false);
				}
			}

			if (!latest) {
				return;
			}

			if (
				latest.status === "completed" ||
				latest.status === "failed" ||
				latest.status === "cancelled"
			) {
				if (isDebugEnabled) {
					console.debug("[steps-section] polling stopped (terminal status)", {
						status: latest.status,
					});
				}
				return;
			}

			if (isDebugEnabled) {
				console.debug("[steps-section] scheduling next tick", {
					delayMs: 1500,
				});
			}
			timer = window.setTimeout(tick, 1500);
		}

		if (
			initial.status !== "completed" &&
			initial.status !== "failed" &&
			initial.status !== "cancelled"
		) {
			if (isDebugEnabled) {
				console.debug(
					"[steps-section] initial status is non-terminal; start polling",
					{
						initialStatus: initial.status,
						delayMs: 1500,
					},
				);
			}
			timer = window.setTimeout(tick, 1500);
		} else if (isDebugEnabled) {
			console.debug(
				"[steps-section] initial status is terminal; skip polling",
				{
					initialStatus: initial.status,
				},
			);
		}

		return () => {
			if (isDebugEnabled) {
				console.debug("[steps-section] cleanup (stop polling)");
			}
			cancelled = true;
			if (timer) window.clearTimeout(timer);
			setIsPolling(false);
		};
	}, [initial.status]);

	return (
		<StepsSectionContext.Provider value={{ data, isPolling }}>
			{children}
		</StepsSectionContext.Provider>
	);
}

export function useStepsSection() {
	const ctx = useContext(StepsSectionContext);
	if (!ctx) {
		throw new Error("useStepsSection must be used within StepsSectionProvider");
	}
	return ctx;
}
