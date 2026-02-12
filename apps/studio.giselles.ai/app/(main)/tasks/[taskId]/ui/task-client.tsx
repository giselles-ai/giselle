"use client";

import { useToasts } from "@giselle-internal/ui/toast";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TaskHeader } from "@/components/task/task-header";
import { FinalStepOutput } from "./final-step-output";
import { StepsSection } from "./steps-section";
import type { UITask } from "./task-data";

const isDebugEnabled = process.env.NODE_ENV !== "production";
const AUTHORIZATION_ERROR_MESSAGE = "authorization error";
type RefreshTaskActionResult =
	| { success: true; data: UITask }
	| { success: false; error: string };

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
	refreshAction: () => Promise<RefreshTaskActionResult>;
}) {
	const [data, setData] = useState<UITask>(initial);
	const refreshActionRef = useRef(refreshAction);
	const { toast } = useToasts();
	const router = useRouter();

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
				const result = await refreshActionRef.current();
				if (!result.success) {
					if (isDebugEnabled) {
						console.debug(
							"[task-page] refreshAction returned an error result",
							{
								error: result.error,
							},
						);
					}

					if (result.error === AUTHORIZATION_ERROR_MESSAGE) {
						if (cancelled) {
							return;
						}
						toast("You do not have permission to view this task.", {
							type: "error",
							preserve: false,
						});
						router.replace("/tasks");
						return;
					}

					// Keep polling even if refresh fails (useful while debugging).
					if (!cancelled) {
						timer = window.setTimeout(tick, 3000);
					}
					return;
				}

				latest = result.data;
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
	}, [initial.status, router, toast]);

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
