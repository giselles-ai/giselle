"use client";

import { useState } from "react";
import { WorkspaceTour } from "../components/workspace-tour";

export default function WorkspacesPage() {
	const [isTourOpen, setIsTourOpen] = useState(true);

	const tourSteps = [
		{
			title: "Welcome to Giselle",
			content: "This platform helps you build and manage AI workflows easily.",
			placement: "bottom" as const,
		},
		{
			title: "Your command hub.",
			content:
				"Add Gen nodes, access your knowledge base, manipulate files, invoke other agents, and orchestrate your workflow.",
			placement: "right" as const,
		},
		{
			title: "Node Settings",
			content:
				"Double-tap nodes to edit settings, craft prompts, configure references, and establish connections between nodes to create a seamless generation flow.",
			placement: "left" as const,
		},
		{
			title: "Connecting Nodes",
			content:
				"Connect nodes by hovering over node edges and dragging to your target, or specify connections directly in node settings to create powerful automation pathways.",
			placement: "right" as const,
		},
		{
			title: "Workflow Modes",
			content:
				"Experience the complete development lifecycle with three specialized modes: Build to design your node workflows, Preview to test and validate your creations, and Integrate to connect with GitHub and deploy your solutions seamlessly.",
			placement: "bottom" as const,
		},
		{
			title: "Resources & Support",
			content:
				'Get help when you need it. Explore our comprehensive <a href="https://docs.giselles.ai/introduction" style="text-decoration: underline; color: #0087f6;">Docs</a> for detailed guidance and best practices whenever you encounter challenges.',
			placement: "bottom" as const,
		},
	];

	return (
		<div
			className="min-h-screen text-white p-8 relative"
			style={{
				backgroundColor: "#0f1116",
				backgroundImage: "radial-gradient(circle at 50% 50%, #1a1f2e, #0f1116)",
			}}
		>
			<div className="max-w-6xl mx-auto relative z-10">
				<div className="flex justify-between items-center mb-8">
					<h1 className="text-2xl font-bold">Giselle Workspaces</h1>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{/* ワークスペースのリストなどがここに表示される */}
				</div>
			</div>

			{/* ガイドツアーコンポーネント */}
			<WorkspaceTour
				steps={tourSteps}
				isOpen={isTourOpen}
				onClose={() => setIsTourOpen(false)}
			/>
		</div>
	);
}
