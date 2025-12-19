"use client";

import { AnimatePresence, motion } from "motion/react";
import { useShallow } from "zustand/shallow";
import { TaskHeader } from "@/components/task/task-header";
import { TaskLayout } from "@/components/task/task-layout";
import { useTaskOverlayStore } from "../stores/task-overlay-store";

export function TaskOverlay() {
	const { isVisible, overlayApp, overlayInput } = useTaskOverlayStore(
		useShallow((state) => ({
			isVisible: state.isVisible,
			overlayApp: state.overlayApp,
			overlayInput: state.overlayInput,
		})),
	);

	return (
		<AnimatePresence>
			{isVisible && overlayApp ? (
				<motion.div
					className="absolute inset-0 bg-background"
					initial={{ opacity: 0, scale: 0.995, y: 10 }}
					animate={{
						opacity: 1,
						scale: 1,
						y: 0,
						transition: { duration: 0.22, ease: "easeOut" },
					}}
					exit={{
						opacity: 0,
						y: 0,
						transition: { duration: 0.18, ease: "easeIn" },
					}}
				>
					<TaskLayout>
						<TaskHeader
							status="inProgress"
							title={overlayApp.name}
							description={overlayApp.description ?? ""}
							workspaceId={overlayApp.workspaceId}
							input={overlayInput}
						/>

						<p className="text-[13px] text-text-muted/70 italic">
							<span
								className="bg-[length:200%_100%] bg-clip-text bg-gradient-to-r from-text-muted/70 via-text-muted/35 to-text-muted/70 text-transparent animate-shimmer"
								style={{
									animationDuration: "1s",
									animationTimingFunction: "linear",
								}}
							>
								Creating task...
							</span>
						</p>
					</TaskLayout>
				</motion.div>
			) : null}
		</AnimatePresence>
	);
}
