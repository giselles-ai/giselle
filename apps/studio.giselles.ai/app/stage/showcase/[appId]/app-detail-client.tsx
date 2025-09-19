"use client";

import { StatusBadge } from "@giselle-internal/ui/status-badge";
import { Play, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { GlassButton } from "@/components/ui/glass-button";
import { AvatarImage } from "@/services/accounts/components/user-button/avatar-image";
import { RunModal } from "./components/run-modal";

interface AppDetails {
	id: string;
	name: string;
	description: string;
	owner: string;
	updatedAt: string;
	status: string;
	runTime: string;
	requests: string;
	executionCount: number;
	totalOutput: string;
	tokens: string;
	llm: string;
	isFavorite: boolean;
	favoriteCount: number;
	teamId: string;
	workspaceId: string;
	creator: {
		name: string;
		avatarUrl?: string;
	};
	previewCard: {
		title: string;
		creator: string;
		stats: {
			likes: string;
			views: string;
		};
	};
	executionHistory: Array<{
		id: string;
		status: string;
		createdAt: Date;
		duration: string;
	}>;
}

interface AppDetailClientProps {
	appDetails: AppDetails;
}

export function AppDetailClient({ appDetails }: AppDetailClientProps) {
	const [isFavorite, setIsFavorite] = useState(appDetails.isFavorite);
	const [isRunModalOpen, setIsRunModalOpen] = useState(false);

	const toggleFavorite = () => {
		setIsFavorite(!isFavorite);
		// TODO: Add API call to update favorite status
	};

	const handleRunClick = () => {
		setIsRunModalOpen(true);
	};

	return (
		<div className="min-h-screen bg-[var(--color-stage-background)] text-text">
			<div className="flex flex-col h-full">
				{/* Breadcrumb */}
				<div className="p-6 pb-0">
					<div className="flex items-center gap-2 text-sm text-text-muted mb-6">
						<Link
							href="/stage/showcase"
							className="hover:text-text transition-colors"
						>
							Showcase
						</Link>
						<span>&lt;</span>
						<span>{appDetails.name}</span>
					</div>
				</div>

				{/* Main Content - Responsive Layout */}
				<div className="flex flex-col lg:flex-row p-4 lg:p-6 gap-4 lg:gap-6">
					{/* App Thumbnail */}
					<div className="w-full lg:w-96 flex-shrink-0">
						<div
							className="relative flex h-48 lg:h-60 w-full rounded-[12px] border-[0.5px] bg-[linear-gradient(135deg,rgba(100,130,200,0.20)_0%,rgba(60,80,120,0.35)_40%,rgba(20,30,60,0.85)_100%)]"
							style={
								{
									"--spotlight-color": "rgba(255,255,255,0.15)",
									borderColor: "rgba(160,180,255,0.15)",
								} as React.CSSProperties
							}
						>
							{/* Top reflection line */}
							<div className="pointer-events-none absolute top-0 left-4 right-4 z-10 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

							{/* Subtle inner border */}
							<div className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] border-[0.5px] border-white/5" />

							<div className="relative z-10 flex h-full w-full flex-col items-center justify-center text-white/80">
								<div className="w-full h-full bg-white/5 rounded-lg flex items-center justify-center">
									<svg
										role="img"
										aria-label="App icon"
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 486 640"
										className="h-12 w-12 text-white/30"
										fill="currentColor"
									>
										<title>App Icon</title>
										<path d="M278.186 397.523C241.056 392.676 201.368 394.115 171.855 391.185C142.556 387.776 131.742 363.167 136.856 355.603C158.378 364.712 177.928 368.547 201.794 368.387C241.642 368.227 275.576 356.242 303.544 332.486C331.511 308.729 345.362 280.285 344.936 247.207C342.912 222.545 327.782 184.194 293.742 157.188C290.971 154.791 283.673 150.583 283.673 150.583C258.635 135.615 230.188 128.318 198.438 128.69C170.843 130.129 149.747 135.509 126.574 143.711C73.0358 162.781 54.7103 208.589 55.243 249.018V249.924C63.1273 312.298 93.8652 328.757 125.935 351.342L88.1651 394.913L89.1772 400.613C89.1772 400.613 144.527 399.441 174.412 401.998C257.783 410.84 291.877 467.408 292.516 511.14C293.209 560.784 250.431 625.022 180.645 625.555C81.2397 626.354 78.5229 422.292 78.5229 422.292L0 504.215C2.6636 550.237 46.613 601.958 82.5182 617.938C130.356 636.847 187.251 632.107 211.969 629.603C237.486 627.046 363.368 607.072 379.136 498.143C379.136 467.302 358.041 407.964 278.186 397.523ZM266.093 226.433C279.678 277.302 283.14 315.334 263.749 345.27C250.538 359.598 229.868 364.872 209.199 363.114C206.535 362.901 179.207 358.267 162.746 322.685C179.26 301.272 218.522 250.563 255.599 204.222C260.66 209.814 266.093 226.487 266.093 226.487V226.433ZM136.643 152.607H136.536C149.534 135.935 185.44 129.916 203.392 135.349C221.771 144.404 235.515 161.023 250.645 192.769L196.201 261.909L156.62 312.245C150.333 300.633 144.58 286.997 140.158 271.337C120.927 203.103 123.484 170.877 136.589 152.607H136.643Z" />
										<path d="M370.506 0C370.506 55.3433 310.362 106.638 255.013 106.638C310.362 106.638 370.506 157.933 370.506 213.277C370.506 157.933 430.65 106.638 486 106.638C430.650 106.638 370.506 55.3433 370.506 0Z" />
									</svg>
								</div>
							</div>
						</div>
					</div>

					{/* App Details */}
					<div className="flex-1 flex flex-col justify-between">
						<div>
							{/* App Title */}
							<h1 className="text-3xl font-bold mb-3">{appDetails.name}</h1>

							{/* Creator Info */}
							<div className="flex items-center gap-2 mb-4">
								{appDetails.creator.avatarUrl ? (
									<AvatarImage
										avatarUrl={appDetails.creator.avatarUrl}
										width={24}
										height={24}
										alt={appDetails.creator.name}
										className="rounded-full"
									/>
								) : (
									<div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
										<span className="text-xs text-text-muted">
											{appDetails.creator.name.charAt(0).toUpperCase()}
										</span>
									</div>
								)}
								<span className="text-sm text-text-muted">
									{appDetails.creator.name}
								</span>
							</div>

							{/* Description */}
							<p className="text-text-muted text-sm leading-relaxed">
								{appDetails.description}
							</p>
						</div>

						{/* Stats and Action Buttons */}
						<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
							{/* Left: Stats */}
							<div className="flex items-center gap-3">
								<div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 text-sm text-text">
									<Play className="h-4 w-4" fill="currentColor" />
									<span>{appDetails.executionCount}</span>
								</div>
								<button
									type="button"
									onClick={toggleFavorite}
									className={`group flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-colors ${
										isFavorite
											? "bg-yellow-500/20 text-yellow-400"
											: "bg-white/10 text-text hover:bg-white/20"
									}`}
								>
									<Star
										className={`h-4 w-4 transition-all ${isFavorite ? "fill-current" : "group-hover:fill-current"}`}
									/>
									<span>{appDetails.favoriteCount}</span>
								</button>
							</div>

							{/* Action Buttons */}
							<div className="flex items-center gap-2 w-full sm:w-auto">
								<Link
									href={
										appDetails.id
											? `/workspaces/${appDetails.id}`
											: "/playground"
									}
									className="rounded-lg px-3 py-2 text-text transition-all duration-200 active:scale-[0.98] text-sm flex-1 sm:flex-none text-center"
									style={{
										background:
											"linear-gradient(180deg, #202530 0%, #12151f 100%)",
										border: "1px solid rgba(0,0,0,0.7)",
										boxShadow:
											"inset 0 1px 1px rgba(255,255,255,0.05), 0 2px 8px rgba(5,10,20,0.4), 0 1px 2px rgba(0,0,0,0.3)",
									}}
								>
									Edit
								</Link>
								<GlassButton
									onClick={handleRunClick}
									className="flex-1 sm:flex-none justify-center"
								>
									<Play className="h-3 w-3" />
									Run
								</GlassButton>
							</div>
						</div>
					</div>
				</div>

				{/* Additional Details Section */}
				<div className="px-4 lg:px-6 pb-6">
					<div className="flex flex-col lg:flex-row gap-6">
						{/* Left Column - App History */}
						<div className="flex-1 rounded-lg p-6">
							<h3 className="text-lg font-medium text-text mb-4">
								My Execution History
							</h3>
							<div className="space-y-3">
								{appDetails.executionHistory.length > 0 ? (
									appDetails.executionHistory.map((execution) => (
										<div
											key={execution.id}
											className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
										>
											<div className="flex items-center gap-3">
												<StatusBadge
													status={
														execution.status === "success" ? "success" : "error"
													}
													variant="dot"
												>
													{execution.status === "success"
														? "Success"
														: "Failed"}
												</StatusBadge>
												<div>
													<div className="text-xs text-[var(--color-text-60)]">
														{new Intl.RelativeTimeFormat("en", {
															numeric: "auto",
														}).format(
															Math.floor(
																(execution.createdAt.getTime() - Date.now()) /
																	(1000 * 60 * 60 * 24),
															),
															"day",
														)}
													</div>
												</div>
											</div>
											<div className="text-xs text-text-muted">
												{execution.duration}
											</div>
										</div>
									))
								) : (
									<div className="text-sm text-text-muted text-center py-4">
										No execution history found
									</div>
								)}
							</div>
						</div>

						{/* Divider */}
						<div className="w-full lg:w-px h-px lg:h-auto bg-white/10"></div>

						{/* Right Column - App Details */}
						<div className="flex-1 rounded-lg p-6">
							<h3 className="text-lg font-medium text-text mb-4">
								App Details
							</h3>
							<div className="space-y-4">
								<div className="flex justify-between">
									<span className="text-text-muted text-sm">Team</span>
									<span className="text-text text-sm">{appDetails.owner}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-text-muted text-sm">Owner</span>
									<span className="text-text text-sm">
										{appDetails.creator.name}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-text-muted text-sm">Updated</span>
									<span className="text-text text-sm">
										{appDetails.updatedAt}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-text-muted text-sm">Status</span>
									<StatusBadge
										status={
											appDetails.status === "Active" ? "success" : "ignored"
										}
										variant="dot"
									>
										{appDetails.status}
									</StatusBadge>
								</div>
								<div className="flex justify-between">
									<span className="text-text-muted text-sm">LLM</span>
									<span className="text-text text-sm">{appDetails.llm}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-text-muted text-sm">Runtime</span>
									<span className="text-text text-sm">
										{appDetails.runTime}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-text-muted text-sm">Requests</span>
									<span className="text-text text-sm">
										{appDetails.requests}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-text-muted text-sm">Total output</span>
									<span className="text-text text-sm">
										{appDetails.totalOutput}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-text-muted text-sm">Tokens</span>
									<span className="text-text text-sm">{appDetails.tokens}</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<RunModal
				isOpen={isRunModalOpen}
				onClose={() => setIsRunModalOpen(false)}
				appName={appDetails.name}
				workspaceId={appDetails.workspaceId}
				teamId={appDetails.teamId}
			/>
		</div>
	);
}
