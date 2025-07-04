"use client";

import {
	useFeatureFlag,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle-engine/react";
import { useCallback, useState } from "react";
import { ReadOnlyBanner } from "../../ui/read-only-banner";
import { KeyboardShortcuts } from "../keyboard-shortcuts";
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
	const { data } = useWorkflowDesigner();
	const [showReadOnlyBanner, setShowReadOnlyBanner] = useState(isReadOnly);
	const [layoutState, setLayoutState] = useState<V2LayoutState>({
		leftPanel: null,
	});
	const [isTourOpen, setIsTourOpen] = useState(data.nodes.length === 0);

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

	const handleLeftPanelClose = useCallback(() => {
		setLayoutState((prev) => ({
			...prev,
			leftPanel: null,
		}));
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
							onLeftPaelValueChange={handleLeftPanelValueChange}
							activePanel={layoutState.leftPanel}
						/>
					</>
				) : (
					<V2Container
						{...layoutState}
						onLeftPanelClose={handleLeftPanelClose}
					/>
				)}
			</RootProvider>
			<KeyboardShortcuts />
			<WorkspaceTour
				steps={tourSteps}
				isOpen={isTourOpen}
				onOpenChange={setIsTourOpen}
			/>
		</div>
	);
}
