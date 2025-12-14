"use client";

import { useEffect, useRef, useState } from "react";
import { TaskHeader } from "@/components/task/task-header";
import { FinalStepOutput } from "./final-step-output";
import { PsuedoAgenticText } from "./psuedo-agentic-text";
import { StepsSection } from "./steps-section";
import type { UITask } from "./task-data";

const isDebugEnabled = process.env.NODE_ENV !== "production";

function isTerminalTaskStatus(status: UITask["status"]) {
	return (
		status === "completed" || status === "failed" || status === "cancelled"
	);
}

export function TaskClient({
	initial,
	refreshAction,
}: {
	initial: UITask;
	refreshAction: () => Promise<UITask>;
}) {
	const [data, setData] = useState<UITask>(initial);
	const refreshActionRef = useRef(refreshAction);
	const totalStepsCount = data.stepsSection.totalStepsCount;
	const stepsLabel = totalStepsCount === 1 ? "step" : "steps";
	const taskOverview =
		data.description.trim().length > 0 ? ` Overview: ${data.description}` : "";

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
		};
	}, [initial.status]);

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
				<p className="text-[13px] text-text-muted/70">
					Task created.{taskOverview} This task has {totalStepsCount}{" "}
					{stepsLabel}, and they will run in order.
				</p>
				<StepsSection {...data.stepsSection} />
				<PsuedoAgenticText task={data} revealMode="dissolve" />
				<FinalStepOutput finalStep={data.finalStep} />
			</div>
		</>
	);
}
