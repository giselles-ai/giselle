"use client";

import { GreetingHeading } from "./greeting-heading";
import { Zap } from "lucide-react";
import { X } from "lucide-react";
import { useState } from "react";

interface LobbyClientProps {
	username: string;
}

export function LobbyClient({ username }: LobbyClientProps) {
	const [showTutorial, setShowTutorial] = useState(true);

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
			<div className="mb-6 flex justify-center">
				<GreetingHeading username={username} />
			</div>

			{/* Where to start today? */}
			<section className="mb-8">
				<h2
					className="text-[24px] font-semibold mb-8 text-center text-text"
					style={{
						textShadow:
							"0 0 10px rgba(192, 219, 254, 0.3), 0 0 20px rgba(192, 219, 254, 0.2), 0 0 30px rgba(192, 219, 254, 0.1)",
					}}
				>
					Where to start today?
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
					<button
						type="button"
						className="rounded-[12px] h-24 bg-surface/30 border border-border/10 text-left px-4 hover:bg-surface/40 transition-colors flex items-center gap-3 group"
					>
						<Zap className="h-6 w-6 text-text shrink-0" />
						<div className="flex flex-col">
							<span
								className="text-text font-medium"
								style={{
									textShadow:
										"0 0 8px rgba(255, 255, 255, 0.2), 0 0 16px rgba(255, 255, 255, 0.1)",
								}}
							>
								Create new Agent
							</span>
							<span className="text-text/60 text-sm">Building an Agent from Scratch</span>
						</div>
					</button>
					<button
						type="button"
						className="rounded-[12px] h-24 bg-surface/30 border border-border/10 text-left px-4 hover:bg-surface/40 transition-colors flex items-center gap-3 group"
					>
						<Zap className="h-6 w-6 text-text shrink-0" />
						<div className="flex flex-col">
							<span
								className="text-text font-medium"
								style={{
									textShadow:
										"0 0 8px rgba(255, 255, 255, 0.2), 0 0 16px rgba(255, 255, 255, 0.1)",
								}}
							>
								Add Knowledge
							</span>
							<span className="text-text/60 text-sm">Building an Agent from Scratch</span>
						</div>
					</button>
					<button
						type="button"
						className="rounded-[12px] h-24 bg-surface/30 border border-border/10 text-left px-4 hover:bg-surface/40 transition-colors flex items-center gap-3 group"
					>
						<Zap className="h-6 w-6 text-text shrink-0" />
						<div className="flex flex-col">
							<span
								className="text-text font-medium"
								style={{
									textShadow:
										"0 0 8px rgba(255, 255, 255, 0.2), 0 0 16px rgba(255, 255, 255, 0.1)",
								}}
							>
								Try templates
							</span>
							<span className="text-text/60 text-sm">Building an Agent from Scratch</span>
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
