"use client";

import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { TaskHeader } from "@/components/task/task-header";
import { FinalStepOutput } from "./final-step-output";
import { StepsSection } from "./steps-section";
import type { UITask } from "./task-data";

interface TaskContextValue {
	data: UITask;
	isPolling: boolean;
}

const TaskContext = createContext<TaskContextValue | null>(null);

const isDebugEnabled = process.env.NODE_ENV !== "production";

function isTerminalTaskStatus(status: UITask["status"]) {
	return (
		status === "completed" || status === "failed" || status === "cancelled"
	);
}

function TaskProvider({
	initial,
	children,
	refreshAction,
}: {
	initial: UITask;
	children: ReactNode;
	refreshAction: () => Promise<UITask>;
}) {
	const [data, setData] = useState<UITask>(initial);
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
					console.debug("[task-page] tick aborted (cancelled)");
				}
				return;
			}

			if (isDebugEnabled) {
				console.debug("[task-page] tick start");
			}

			setIsPolling(true);
			let latest: UITask | null = null;
			try {
				latest = await refreshActionRef.current();
				if (isDebugEnabled) {
					console.debug("[task-page] refreshAction resolved", {
						status: latest.status,
					});
				}

				if (!cancelled) {
					setData(latest);
				}
			} catch (error) {
				if (isDebugEnabled) {
					console.debug("[task-page] refreshAction failed", error);
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

			if (isTerminalTaskStatus(latest.status)) {
				if (isDebugEnabled) {
					console.debug("[task-page] polling stopped (terminal status)", {
						status: latest.status,
					});
				}
				return;
			}

			if (isDebugEnabled) {
				console.debug("[task-page] scheduling next tick", { delayMs: 1500 });
			}
			timer = window.setTimeout(tick, 1500);
		}

		if (!isTerminalTaskStatus(initial.status)) {
			if (isDebugEnabled) {
				console.debug(
					"[task-page] initial status is non-terminal; start polling",
					{
						initialStatus: initial.status,
						delayMs: 1500,
					},
				);
			}
			timer = window.setTimeout(tick, 1500);
		} else if (isDebugEnabled) {
			console.debug("[task-page] initial status is terminal; skip polling", {
				initialStatus: initial.status,
			});
		}

		return () => {
			if (isDebugEnabled) {
				console.debug("[task-page] cleanup (stop polling)");
			}
			cancelled = true;
			if (timer) window.clearTimeout(timer);
			setIsPolling(false);
		};
	}, [initial.status]);

	return (
		<TaskContext.Provider value={{ data, isPolling }}>
			{children}
		</TaskContext.Provider>
	);
}

function useTask() {
	const ctx = useContext(TaskContext);
	if (!ctx) {
		throw new Error("useTask must be used within TaskProvider");
	}
	return ctx;
}

export function TaskClient({
	initial,
	refreshAction,
}: {
	initial: UITask;
	refreshAction: () => Promise<UITask>;
}) {
	return (
		<TaskProvider initial={initial} refreshAction={refreshAction}>
			<TaskContainer />
		</TaskProvider>
	);
}

function TaskContainer() {
	const { data } = useTask();

	return (
		<>
			<TaskHeader
				status={data.status}
				title={data.title}
				description={data.description}
				workspaceId={data.workspaceId}
				input={data.input}
			/>
			<div className="flex-1 overflow-y-auto overflow-x-hidden pb-8">
				<StepsSection {...data.stepsSection} />
				<FinalStepOutput finalStep={data.finalStep} />
			</div>
		</>
	);
}
