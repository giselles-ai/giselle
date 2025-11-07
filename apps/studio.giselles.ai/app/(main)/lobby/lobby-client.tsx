"use client";

import { X, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GreetingHeading } from "./greeting-heading";

interface LobbyClientProps {
	username: string;
}

export function LobbyClient({ username }: LobbyClientProps) {
	const [showTutorial, setShowTutorial] = useState(true);
	const router = useRouter();
	const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

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
		<>
			{/* Tutorial Video Section */}
			{showTutorial && (
				<section className="mb-8 relative">
					<div className="h-32 md:h-40 w-full rounded-[12px] bg-surface/30 border border-border/10 grid place-items-center">
						<span className="text-text/60 text-sm">
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

			{/* Greeting above "Where to start today?" */}
			<div className="mb-12 flex justify-center">
				<GreetingHeading username={username} />
			</div>

			{/* Where to start today? */}
			<section className="mb-8 relative">
				{/* Top light overlay */}
				<div className="pointer-events-none absolute left-0 -top-8 h-[400px] w-full overflow-hidden">
					<div
						className="
							relative h-full w-full 
							bg-gradient-to-b from-[rgba(255,255,255,0.15)] via-[rgba(255,255,255,0.05)] to-transparent 
							blur-[6px] opacity-90 
							[mask-image:radial-gradient(circle_at_50%_0,black_20%,transparent_100%)]
						"
					>
						<div
							className="
								absolute left-1/2 top-0 h-[3px] w-[80%] -translate-x-1/2
								bg-gradient-to-r from-transparent via-white/[0.6] to-transparent
								blur-[2px]
							"
						/>
					</div>
				</div>
				<h2
					className="text-[24px] font-medium mt-12 mb-8 text-center text-text relative z-10"
					style={{
						textShadow:
							"0 0 10px rgba(192, 219, 254, 0.3), 0 0 20px rgba(192, 219, 254, 0.2), 0 0 30px rgba(192, 219, 254, 0.1)",
					}}
				>
					Where to start today?
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto relative z-10">
					<button
						type="button"
						onClick={handleCreateNewAgent}
						disabled={isCreatingWorkspace}
						className="relative rounded-[12px] overflow-hidden w-full h-24 bg-white/[0.02] backdrop-blur-[8px] border-[0.5px] border-border shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(255,255,255,0.2)] before:content-[''] before:absolute before:inset-0 before:bg-white before:opacity-[0.02] before:rounded-[inherit] before:pointer-events-none hover:border-border transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5 text-left px-4 flex items-center gap-3 group cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0"
					>
						<Zap className="h-6 w-6 text-text shrink-0 relative z-10" />
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
					<button
						type="button"
						onClick={handleAskReview}
						className="relative rounded-[12px] overflow-hidden w-full h-24 bg-white/[0.02] backdrop-blur-[8px] border-[0.5px] border-border shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(255,255,255,0.2)] before:content-[''] before:absolute before:inset-0 before:bg-white before:opacity-[0.02] before:rounded-[inherit] before:pointer-events-none hover:border-border transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5 text-left px-4 flex items-center gap-3 group cursor-pointer"
					>
						<Zap className="h-6 w-6 text-text shrink-0 relative z-10" />
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
						disabled
						className="relative rounded-[12px] overflow-hidden w-full h-24 bg-white/[0.02] backdrop-blur-[8px] border-[0.5px] border-border shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(255,255,255,0.2)] before:content-[''] before:absolute before:inset-0 before:bg-white before:opacity-[0.02] before:rounded-[inherit] before:pointer-events-none transition-all duration-200 text-left px-4 flex items-center gap-3 group cursor-not-allowed opacity-60 hover:scale-100 hover:translate-y-0"
					>
						<Zap className="h-6 w-6 text-text shrink-0 relative z-10" />
						<div className="flex flex-col relative z-10">
							<span
								className="text-text font-medium"
								style={{
									textShadow:
										"0 0 8px rgba(255, 255, 255, 0.2), 0 0 16px rgba(255, 255, 255, 0.1)",
								}}
							>
								Try template
							</span>
							<span className="text-text/60 text-sm">
								Start with pre-built templates
							</span>
						</div>
					</button>
				</div>
			</section>

			{/* Use Apps */}
			<section className="mb-6">
				<h2 className="text-[18px] font-semibold mb-3">Use Apps</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="rounded-[8px] aspect-video bg-surface/30 border border-border/10 grid place-items-center text-text/60 text-sm">
						テンプレ予定のappをいれる
					</div>
					<div className="rounded-[8px] aspect-video bg-surface/30 border border-border/10 grid place-items-center text-text/60 text-sm">
						テンプレ予定のappをいれる
					</div>
					<div className="rounded-[8px] aspect-video bg-surface/30 border border-border/10 grid place-items-center text-text/60 text-sm">
						テンプレ予定のappをいれる
					</div>
				</div>
			</section>

			{/* Create workflow */}
			<section>
				<h2 className="text-[18px] font-semibold mb-3">Create workflow</h2>
				<p className="text-sm text-text/60 mb-3">
					Build a any agent workflow with custom logic and tools
				</p>
				<div className="rounded-[8px] h-20 bg-surface/30 border border-border/10 grid place-items-center">
					<button type="button" className="text-link-muted hover:underline">
						+ create
					</button>
				</div>
			</section>
		</>
	);
}
