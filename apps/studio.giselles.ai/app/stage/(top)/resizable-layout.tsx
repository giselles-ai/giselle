"use client";

import { useEffect, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

interface ResizableLayoutProps {
	mainContent: React.ReactNode;
	actsContent: React.ReactNode;
}

export function ResizableLayout({
	mainContent,
	actsContent,
}: ResizableLayoutProps) {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);

		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	if (isMobile) {
		return (
			<div className="h-full flex flex-col">
				<div className="flex-1">{mainContent}</div>
			</div>
		);
	}

	return (
		<PanelGroup direction="horizontal" className="h-full">
			<Panel defaultSize={70} minSize={50}>
				{mainContent}
			</Panel>

			<PanelResizeHandle className="w-[3px] bg-black-70/50 hover:bg-black-70 cursor-col-resize" />

			<Panel defaultSize={30} minSize={20} maxSize={50}>
				{actsContent}
			</Panel>
		</PanelGroup>
	);
}
