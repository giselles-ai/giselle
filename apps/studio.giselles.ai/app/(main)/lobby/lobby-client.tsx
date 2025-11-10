"use client";

import { Blocks, Copy, SparklesIcon, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppIcon } from "@giselle-internal/ui/app-icon";
import clsx from "clsx/lite";
import { GreetingHeading } from "./greeting-heading";

interface LobbyClientProps {
	username: string;
}

export function LobbyClient({ username }: LobbyClientProps) {
	const [showTutorial, setShowTutorial] = useState(true);
	const [activeTab, setActiveTab] = useState<"apps" | "workflow">("apps");
	const [activeAppTab, setActiveAppTab] = useState<string>("Recent");
	const [activeWorkflowTab, setActiveWorkflowTab] = useState<string>("Recent");
	const router = useRouter();
	const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

	// TODO: 実際のデータから取得する
	const hasRecentApps = false; // 使ったことがあるappがあるかどうか
	const hasRecentWorkflows = false; // 使ったことがあるworkflowがあるかどうか

	const featuredApps = [
		{ title: "AI Writing Assistant", appsCount: 3 },
		{ title: "Data Analyzer", appsCount: 2 },
		{ title: "Customer Support Bot", appsCount: 4 },
	];

	const recentApps = [
		{ title: "Recent App 1", appsCount: 1 },
		{ title: "Recent App 2", appsCount: 2 },
	];

	const featuredWorkflows = [
		{ id: "wf1", name: "Content Generation Workflow", updatedAt: new Date() },
		{ id: "wf2", name: "Data Processing Pipeline", updatedAt: new Date() },
		{ id: "wf3", name: "Customer Support Automation", updatedAt: new Date() },
	];

	const recentWorkflows = [
		{ id: "rwf1", name: "Recent Workflow 1", updatedAt: new Date() },
		{ id: "rwf2", name: "Recent Workflow 2", updatedAt: new Date() },
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
				<section className="relative rounded-[12px] overflow-hidden">
					{/* Background with gradient and image */}
					<div className="relative h-48 md:h-56 w-full bg-gradient-to-br from-blue-900/50 via-purple-900/50 to-pink-900/50">
						<Image
							src="/stage.jpg"
							alt="Tutorial background"
							fill
							className="object-cover"
							priority
						/>
						<div className="absolute inset-0 bg-black/20" />
					</div>

					{/* Label - top */}
					<div className="absolute top-6 left-8 z-10">
						<span className="inline-block px-3 py-1 rounded-full bg-blue-700 text-white text-xs font-semibold uppercase w-fit">
							New Feature
						</span>
					</div>

					{/* Content */}
					<div className="absolute inset-0 flex items-end justify-between py-6 px-8">
						{/* Left section with title and description */}
						<div className="flex flex-col gap-3 flex-1">
							{/* Title */}
							<h2 className="text-2xl md:text-3xl font-sans text-white font-bold">
								Stage is here
							</h2>
							{/* Description */}
							<p className="text-sm text-white/80 max-w-md">
								Try powerful agents instantly. Ask anything, get answers.
							</p>
						</div>

						{/* Right section with CTA buttons */}
						<div className="flex items-center gap-3 shrink-0">
							<button
								type="button"
								className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors"
							>
								Watch Now
							</button>
							<button
								type="button"
								className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm border border-white/20 hover:bg-white/20 transition-colors"
							>
								Learn More
							</button>
						</div>
					</div>

					{/* Close button - top right */}
					<button
						type="button"
						onClick={() => setShowTutorial(false)}
						className="absolute top-6 right-8 text-white transition-colors z-10 hover:opacity-80"
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
						{/* Sub-tabs - 使ったことがあるworkflowがある場合のみ表示 */}
						{hasRecentWorkflows && (
							<div className="mb-4">
								<div className="flex items-center gap-4">
									{["Recent", "Featured"].map((subTab) => {
										const isActive = activeWorkflowTab === subTab;
										return (
											<button
												key={subTab}
												type="button"
												onClick={() => setActiveWorkflowTab(subTab)}
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
						<div className="flex flex-wrap gap-4">
							{(hasRecentWorkflows && activeWorkflowTab === "Recent"
								? recentWorkflows
								: featuredWorkflows
							).map((workflow) => {
								const isFeatured =
									!hasRecentWorkflows ||
									activeWorkflowTab === "Featured";
								const handleMouseMove = (
									e: React.MouseEvent<HTMLDivElement>,
								) => {
									const card = e.currentTarget;
									const rect = card.getBoundingClientRect();
									card.style.setProperty(
										"--mouse-x",
										`${e.clientX - rect.left}px`,
									);
									card.style.setProperty(
										"--mouse-y",
										`${e.clientY - rect.top}px`,
									);
								};

								return (
									<div
										key={workflow.id}
										onMouseMove={handleMouseMove}
										className={clsx(
											"group relative flex h-[300px] w-[267px] flex-none flex-col rounded-[12px]",
											"bg-[linear-gradient(135deg,rgba(100,130,200,0.20)_0%,rgba(60,80,120,0.35)_40%,rgba(20,30,60,0.85)_100%)]",
											"filter grayscale hover:grayscale-0 transition duration-500",
										)}
										style={
											{
												"--spotlight-color": "rgba(255,255,255,0.15)",
											} as React.CSSProperties
										}
									>
										<div
											className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-500 group-hover:opacity-100 rounded-[inherit]"
											style={{
												background:
													"radial-gradient(circle at var(--mouse-x) var(--mouse-y), var(--spotlight-color), transparent 50%)",
											}}
										/>

										{/* Top reflection line (muted) */}
										<div className="pointer-events-none absolute top-0 left-4 right-4 z-10 h-px bg-gradient-to-r from-transparent via-text/20 to-transparent" />

										{/* Subtle inner border */}
										<div className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] border-[0.5px] border-border-muted" />

										<div className="relative z-10 flex h-full w-full cursor-pointer flex-col pt-2 px-2 pb-4">
											{!isFeatured && (
												<div className="flex w-full justify-end gap-x-2">
													<button
														type="button"
														aria-label="Duplicate workflow"
														className="grid size-6 place-items-center rounded-full text-text/60 transition-colors hover:text-inverse"
													>
														<Copy className="size-4" />
													</button>
													<button
														type="button"
														aria-label="Delete workflow"
														className="grid size-6 place-items-center rounded-full text-text/60 transition-colors hover:text-red-500"
													>
														<Trash2 className="size-4" />
													</button>
												</div>
											)}
											<Link
												href={`/workflow/${workflow.id}`}
												className="flex h-full flex-col pt-2"
												prefetch={false}
											>
												<div className="aspect-video w-full rounded-lg flex items-center justify-center bg-[color-mix(in_srgb,var(--color-surface-background,_#2f343e)_20%,transparent)]">
													<AppIcon />
												</div>
												<div className="mt-3 px-2">
													<h3 className="font-sans text-[16px] font-semibold text-inverse line-clamp-2">
														{workflow.name}
													</h3>
													<div className="flex items-center justify-between mt-1">
														<span className="max-w-[200px] truncate font-geist text-xs text-text/80">
															Edited{" "}
															<span>
																{workflow.updatedAt.toLocaleDateString()}
															</span>
														</span>
													</div>
												</div>
											</Link>
										</div>
									</div>
								);
							})}
						</div>
					</>
				)}
			</section>
		</div>
	);
}
