"use client";

import clsx from "clsx/lite";
import { File, Zap } from "lucide-react";
import Link from "next/link";
import type { agents as dbAgents } from "@/db";
import { GitHubIcon } from "../../../../../../internal-packages/workflow-designer-ui/src/icons";
import { DeleteAgentButton } from "./delete-agent-button";
import { DuplicateAgentButton } from "./duplicate-agent-button";
import { formatExecutionCount } from "./format-execution-count";
import { LLMProviderIcon } from "./llm-provider-icon";

interface AgentCardProps {
	agent: typeof dbAgents.$inferSelect & {
		executionCount?: number;
		creator?: {
			displayName: string | null;
			avatarUrl: string | null;
		} | null;
		githubRepositories?: string[];
		documentVectorStoreFiles?: string[];
		llmProviders?: string[];
	};
}

export function AgentCard({ agent }: AgentCardProps) {
	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		const card = e.currentTarget;
		const rect = card.getBoundingClientRect();
		card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
		card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
	};

	if (!agent.workspaceId) {
		return null;
	}

	return (
		<section
			onMouseMove={handleMouseMove}
			aria-label={agent.name || "Untitled workspace"}
			className={clsx(
				"group relative flex h-[260px] w-full flex-none flex-col rounded-[12px]",
				"bg-[linear-gradient(135deg,rgba(100,130,200,0.20)_0%,rgba(60,80,120,0.35)_40%,rgba(20,30,60,0.85)_100%)]",
				"filter grayscale hover:grayscale-0 transition duration-500",
			)}
			style={
				{ "--spotlight-color": "rgba(255,255,255,0.15)" } as React.CSSProperties
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
				<div className="flex w-full justify-end gap-x-2">
					<DuplicateAgentButton
						agentId={agent.id}
						agentName={agent.name || "Untitled"}
					/>
					<DeleteAgentButton
						agentId={agent.id}
						agentName={agent.name || "Untitled"}
					/>
				</div>
				<Link
					href={`/workspaces/${agent.workspaceId}`}
					className="flex h-full flex-col pt-2 px-2"
					prefetch={false}
				>
					{/* Title */}
					<h3 className="font-sans text-[18px] font-semibold text-inverse line-clamp-2 mb-2">
						{agent.name || "Untitled"}
					</h3>

					{/* Description */}
					<p className="font-geist text-[13px] text-link-muted line-clamp-2">
						Use a Large Language Model to summarize customer feedback.Use...
					</p>

					{/* Integration Icons and Footer */}
					<div className="mt-auto flex flex-col gap-3">
						{/* Vector Stores Group */}
						{(agent.githubRepositories &&
							agent.githubRepositories.length > 0) ||
						(agent.documentVectorStoreFiles &&
							agent.documentVectorStoreFiles.length > 0) ? (
							<div className="flex flex-col">
								{/* GitHub Repositories */}
								{agent.githubRepositories &&
									agent.githubRepositories.length > 0 && (
										<div className="flex items-center gap-2">
											<GitHubIcon className="w-3 h-3 text-text/60 flex-shrink-0" />
											<div className="flex flex-col gap-1 min-w-0 flex-1">
												{(() => {
													const repos = agent.githubRepositories;
													if (!repos) return null;
													return repos.slice(0, 1).map((repo) => (
														<div key={repo} className="flex items-center gap-1">
															<div className="font-geist text-[11px] text-text/60 truncate">
																{repo}
															</div>
															{repos.length > 1 && (
																<span className="font-geist text-[11px] text-text/60 flex-shrink-0 px-1.5 py-0.5 rounded-lg border border-border-muted">
																	+{repos.length - 1}
																</span>
															)}
														</div>
													));
												})()}
											</div>
										</div>
									)}

								{/* Document Vector Store Files */}
								{agent.documentVectorStoreFiles &&
									agent.documentVectorStoreFiles.length > 0 && (
										<div className="flex items-center gap-2">
											<File className="w-3 h-3 text-text/60 flex-shrink-0" />
											<div className="flex flex-col gap-1 min-w-0 flex-1">
												{(() => {
													const files = agent.documentVectorStoreFiles;
													if (!files) return null;
													return files.slice(0, 1).map((fileName) => (
														<div
															key={fileName}
															className="flex items-center gap-1"
														>
															<div className="font-geist text-[11px] text-text/60 truncate">
																{fileName}
															</div>
															{files.length > 1 && (
																<span className="font-geist text-[11px] text-text/60 flex-shrink-0 px-1.5 py-0.5 rounded-lg border border-border-muted">
																	+{files.length - 1}
																</span>
															)}
														</div>
													));
												})()}
											</div>
										</div>
									)}
							</div>
						) : null}

						{/* Integration Icons */}
						<div className="flex items-center gap-2">
							{agent.llmProviders?.map((provider) => (
								<div
									key={provider}
									className="w-7 h-7 rounded bg-white/10 flex items-center justify-center"
								>
									<LLMProviderIcon provider={provider} className="w-4 h-4" />
								</div>
							))}
							{agent.githubRepositories &&
								agent.githubRepositories.length > 0 && (
									<div className="w-7 h-7 rounded bg-white/10 flex items-center justify-center">
										<GitHubIcon className="w-4 h-4 text-text/60" />
									</div>
								)}
							{agent.documentVectorStoreFiles &&
								agent.documentVectorStoreFiles.length > 0 && (
									<div className="w-7 h-7 rounded bg-white/10 flex items-center justify-center">
										<File className="w-4 h-4 text-text/60" />
									</div>
								)}
						</div>

						{/* Footer: Creator and Stats */}
						<div className="flex items-center justify-between">
							<span className="font-geist text-[12px] text-text/70">
								by {agent.creator?.displayName || "Unknown"}
							</span>
							<div className="flex items-center gap-3">
								{/* <div className="flex items-center gap-1">
									<Star className="w-3 h-3 text-text/70" />
									<span className="font-geist text-[12px] text-text/70">517</span>
								</div> */}
								<div className="flex items-center gap-1">
									<Zap className="w-3 h-3 text-text/70" />
									<span className="font-geist text-[12px] text-text/70">
										{formatExecutionCount(agent.executionCount)}
									</span>
								</div>
							</div>
						</div>
					</div>
				</Link>
			</div>
		</section>
	);
}
