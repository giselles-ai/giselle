"use client";

import {
	useFeatureFlag,
	useWorkflowDesignerStore,
} from "@giselle-sdk/giselle/react";
import { useCallback, useState } from "react";
import { useShallow } from "zustand/shallow";
import { ReadOnlyBanner } from "../../ui/read-only-banner";
import { FloatingChat } from "../chat";
import { tourSteps, WorkspaceTour } from "../workspace-tour";
import { V2Container, V2Footer, V2Header } from "./components";
import { RootProvider } from "./components/provider";
import type { LeftPanelValue, V2LayoutState } from "./state";

export function V2Placeholder({
	isReadOnly = false,
	userRole = "viewer",
	onNameChange,
}: {
	isReadOnly?: boolean;
	userRole?: "viewer" | "guest" | "editor" | "owner";
	onNameChange?: (name: string) => Promise<void>;
}) {
	const defaultTour = useWorkflowDesignerStore(
		useShallow((s) => s.workspace.nodes.length === 0),
	);
	const [showReadOnlyBanner, setShowReadOnlyBanner] = useState(isReadOnly);
	const [layoutState, setLayoutState] = useState<V2LayoutState>({
		leftPanel: null,
	});
	const [isTourOpen, setIsTourOpen] = useState(defaultTour);
	const [isChatOpen, setIsChatOpen] = useState(false);

	const handleDismissBanner = useCallback(() => {
		setShowReadOnlyBanner(false);
	}, []);

	const handleLeftPanelValueChange = useCallback(
		(newLeftPanelValue: LeftPanelValue) => {
			setLayoutState((prev) => ({
				...prev,
				leftPanel:
					prev.leftPanel === newLeftPanelValue ? null : newLeftPanelValue,
			}));
		},
		[],
	);

	const handleChatToggle = useCallback(() => {
		setIsChatOpen((prev) => !prev);
	}, []);

	const handleLeftPanelClose = useCallback(() => {
		setLayoutState((prev) => ({
			...prev,
			leftPanel: null,
		}));
	}, []);

	const handleChatClose = useCallback(() => {
		setIsChatOpen(false);
	}, []);

	const { layoutV3 } = useFeatureFlag();

	return (
		<div className="flex-1 overflow-hidden font-sans flex flex-col">
			{showReadOnlyBanner && isReadOnly && (
				<ReadOnlyBanner
					onDismiss={handleDismissBanner}
					userRole={userRole}
					className="z-50"
				/>
			)}

			<RootProvider>
				<V2Header onNameChange={onNameChange} />
				{layoutV3 ? (
					<>
						<V2Container
							{...layoutState}
							onLeftPanelClose={handleLeftPanelClose}
						/>
						<V2Footer
							onLeftPanelValueChange={handleLeftPanelValueChange}
							activePanel={layoutState.leftPanel}
							chat={{ onToggle: handleChatToggle, isOpen: isChatOpen }}
						/>
					</>
				) : (
					<V2Container
						{...layoutState}
						onLeftPanelClose={handleLeftPanelClose}
					/>
				)}
			</RootProvider>
			<WorkspaceTour
				steps={tourSteps}
				isOpen={isTourOpen}
				onOpenChange={setIsTourOpen}
			/>
			<FloatingChat isOpen={isChatOpen} onClose={handleChatClose} />
		</div>
	);
}
