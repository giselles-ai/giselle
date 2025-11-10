"use client";

import { Blocks, SparklesIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GreetingHeading } from "./greeting-heading";

interface LobbyClientProps {
	username: string;
}

export function LobbyClient({ username }: LobbyClientProps) {
	const [showTutorial, setShowTutorial] = useState(true);
	const [activeTab, setActiveTab] = useState<"apps" | "workflow">("apps");
	const [activeAppTab, setActiveAppTab] = useState<string>("Recent");
	const router = useRouter();
	const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

	// TODO: 実際のデータから取得する
	const hasRecentApps = false; // 使ったことがあるappがあるかどうか

	const featuredApps = [
		{ title: "AI Writing Assistant", appsCount: 3 },
		{ title: "Data Analyzer", appsCount: 2 },
		{ title: "Customer Support Bot", appsCount: 4 },
	];

	const recentApps = [
		{ title: "Recent App 1", appsCount: 1 },
		{ title: "Recent App 2", appsCount: 2 },
	];

	const handleCreateNewAgent = async () => {
		if (isCreatingWorkspace) return;
		setIsCreatingWorkspace(true);
		try {
			const response = await fetch("/api/workspaces", { method: "POST" });
			if (!response.ok) {
				throw new Error(`Failed to create workspace: ${response.status}`);
			}

			const data = (await response.json()) as { redirectPath?: string };
			if (!data.redirectPath) {
				throw new Error("Missing redirect path");
			}

			router.push(data.redirectPath);
		} catch (error) {
			console.error(error);
			setIsCreatingWorkspace(false);
		}
	};

	const handleAskReview = () => {
		router.push("/stage");
	};

	return (
		<div className="flex flex-col gap-8">
			{/* Greeting */}
			<div className="flex justify-center">
				<GreetingHeading username={username} />
			</div>

			{/* Tutorial Video Section */}
			{showTutorial && (
				<section className="relative">
					<div className="h-32 md:h-40 w-full rounded-[12px] bg-gray-100 border border-gray-200 grid place-items-center">
						<span className="text-gray-600 text-sm">
							チュートリアル動画スペース (消せる)
						</span>
					</div>
					<button
						type="button"
						onClick={() => setShowTutorial(false)}
						className="absolute top-2 right-2 p-1.5 rounded-full bg-surface/50 hover:bg-surface/70 border border-border/10 text-text/60 hover:text-text transition-colors"
						aria-label="Close tutorial"
					>
						<X className="h-4 w-4" />
					</button>
				</section>
			)}

			{/* Where to start today? */}
			<section className="relative pt-6">
				{/* Top light overlay background */}
				<div className="pointer-events-none absolute left-0 top-0 h-[400px] w-full overflow-hidden z-0">
					<div className="relative h-full w-full bg-gradient-to-b from-[rgba(184,232,244,0.15)] via-[rgba(184,232,244,0.05)] to-transparent blur-[6px] opacity-90 [mask-image:radial-gradient(ellipse_70%_100%_at_50%_0,black_25%,transparent_100%)]">
						<div className="absolute left-1/2 top-0 h-[3px] w-[80%] -translate-x-1/2 bg-gradient-to-r from-transparent via-[rgba(184,232,244,0.6)] to-transparent blur-[2px]" />
					</div>
				</div>
				<h2
					className="text-[20px] font-medium mb-6 text-center text-text relative z-10"
					style={{
						textShadow:
							"0 0 10px rgba(192, 219, 254, 0.3), 0 0 20px rgba(192, 219, 254, 0.2), 0 0 30px rgba(192, 219, 254, 0.1)",
					}}
				>
					Where to start today?
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto relative z-10">
					<button
						type="button"
						onClick={handleAskReview}
						className="relative rounded-[12px] overflow-hidden w-full h-24 bg-white/[0.02] backdrop-blur-[8px] border-[0.5px] border-border shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(255,255,255,0.2)] before:content-[''] before:absolute before:inset-0 before:bg-white before:opacity-[0.02] before:rounded-[inherit] before:pointer-events-none hover:border-border transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5 text-left px-4 flex items-center gap-3 group cursor-pointer"
					>
						<div className="w-10 h-10 flex items-center justify-center shrink-0 relative z-10">
							<SparklesIcon className="h-6 w-6 text-text" />
						</div>
						<div className="flex flex-col relative z-10">
							<span
								className="text-text font-medium"
								style={{
									textShadow:
										"0 0 8px rgba(255, 255, 255, 0.2), 0 0 16px rgba(255, 255, 255, 0.1)",
								}}
							>
								Ask / Review anything
							</span>
							<span className="text-text/60 text-sm">
								Get answers and review content
							</span>
						</div>
					</button>
					<button
						type="button"
						onClick={handleCreateNewAgent}
						disabled={isCreatingWorkspace}
						className="relative rounded-[12px] overflow-hidden w-full h-24 bg-white/[0.02] backdrop-blur-[8px] border-[0.5px] border-border shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(255,255,255,0.2)] before:content-[''] before:absolute before:inset-0 before:bg-white before:opacity-[0.02] before:rounded-[inherit] before:pointer-events-none hover:border-border transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5 text-left px-4 flex items-center gap-3 group cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0"
					>
						<div className="w-10 h-10 flex items-center justify-center shrink-0 relative z-10">
							<Blocks className="h-6 w-6 text-text" />
						</div>
						<div className="flex flex-col relative z-10">
							<span
								className="text-text font-medium"
								style={{
									textShadow:
										"0 0 8px rgba(255, 255, 255, 0.2), 0 0 16px rgba(255, 255, 255, 0.1)",
								}}
							>
								Create new agent
							</span>
							<span className="text-text/60 text-sm">
								Building an Agent from Scratch
							</span>
						</div>
					</button>
				</div>
			</section>

			{/* Use Apps / Create workflow */}
			<section className="mb-6">
				{/* Tabs */}
				<div className="mb-8">
					<div className="flex items-center px-0 py-0 border-b border-border">
						<div className="flex items-center w-full">
							{["Use Apps", "Create workflow"].map((tab) => {
								const isActive =
									(tab === "Use Apps" && activeTab === "apps") ||
									(tab === "Create workflow" && activeTab === "workflow");
								const tabKey =
									tab === "Use Apps" ? "apps" : "workflow";
								return (
									<button
										key={tab}
										type="button"
										onClick={() => setActiveTab(tabKey as "apps" | "workflow")}
										className={`flex-1 text-[16px] font-sans font-medium transition-colors px-2 py-2 relative rounded-md ${
											isActive
												? "text-primary-100 [text-shadow:0px_0px_20px_#0087f6] after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[2px] after:bg-primary-100"
												: "text-tabs-inactive-text hover:text-white-100 hover:after:content-[''] hover:after:absolute hover:after:left-0 hover:after:right-0 hover:after:bottom-0 hover:after:h-[2px] hover:after:bg-primary-100"
										}`}
									>
										{tab}
									</button>
								);
							})}
						</div>
					</div>
				</div>

				{/* Tab Content */}
				{activeTab === "apps" && (
					<>
						{/* Sub-tabs - 使ったことがあるappがある場合のみ表示 */}
						{hasRecentApps && (
							<div className="mb-4">
								<div className="flex items-center gap-4">
									{["Recent", "Featured"].map((subTab) => {
										const isActive = activeAppTab === subTab;
										return (
											<button
												key={subTab}
												type="button"
												onClick={() => setActiveAppTab(subTab)}
												className={`text-base font-semibold transition-colors ${
													isActive ? "text-white" : "text-text/60"
												}`}
											>
												{subTab}
											</button>
										);
									})}
								</div>
							</div>
						)}

						{/* Sub-tab Content */}
						<div className="flex flex-wrap gap-6">
							{(hasRecentApps && activeAppTab === "Recent"
								? recentApps
								: featuredApps
							).map((item, index) => {
								const gradients = [
									"bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600",
									"bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600",
									"bg-gradient-to-br from-green-400 via-blue-500 to-purple-600",
								];
								const gradientClass = gradients[index % gradients.length];

								return (
									<div key={index} className="group w-40">
										{/* Thumbnail area */}
										<button
											type="button"
											className="relative w-40 aspect-square overflow-hidden rounded-lg transition-all duration-300 hover:scale-105 mb-3"
										>
											<div className={`w-full h-full ${gradientClass}`}>
												<div className="absolute inset-0 bg-black/20" />
											</div>
										</button>

										{/* Text content area */}
										<div className="w-full text-left">
											<h3 className="text-white font-semibold text-base group-hover:text-primary-100 transition-colors line-clamp-1">
												{item.title}
											</h3>
										</div>
									</div>
								);
							})}
						</div>
					</>
				)}

				{activeTab === "workflow" && (
					<>
						<p className="text-sm text-text/60 mb-3">
							Build a any agent workflow with custom logic and tools
						</p>
						<div className="rounded-[8px] h-20 bg-surface/30 border border-border/10 grid place-items-center">
							<button type="button" className="text-link-muted hover:underline">
								+ create
							</button>
						</div>
					</>
				)}
			</section>
		</div>
	);
}
