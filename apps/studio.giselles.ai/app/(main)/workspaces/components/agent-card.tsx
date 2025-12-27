"use client";

import clsx from "clsx/lite";
import { File, Zap } from "lucide-react";
import Link from "next/link";
import type { agents as dbAgents } from "@/db";
import { GitHubIcon } from "../../../../../../internal-packages/workflow-designer-ui/src/icons";
import { Tooltip } from "../../../../../../internal-packages/workflow-designer-ui/src/ui/tooltip";
import { DeleteAgentButton } from "./delete-agent-button";
import { DuplicateAgentButton } from "./duplicate-agent-button";
import { formatExecutionCount } from "./format-execution-count";
import { LLMProviderIcon } from "./llm-provider-icon";

interface AgentCardProps {
	agent: typeof dbAgents.$inferSelect & {
		executionCount?: number;
		description?: string | null;
		creator?: {
			displayName: string | null;
			avatarUrl: string | null;
		} | null;
		githubRepositories?: string[];
		documentVectorStoreFiles?: string[];
		llmProviders?: string[];
		hasGithubIntegration?: boolean;
	};
}

export function AgentCard({ agent }: AgentCardProps) {
	if (!agent.workspaceId) {
		return null;
	}

	return (
		<section
			aria-label={agent.name || "Untitled"}
			className={clsx(
				"relative flex h-[252px] w-full flex-none flex-col rounded-[12px]",
				"bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-blue-muted)_10%,var(--color-background))_0%,color-mix(in_srgb,var(--color-blue-muted)_6%,var(--color-stage-background))_55%,color-mix(in_srgb,var(--color-blue-muted)_4%,var(--color-background))_100%)]",
			)}
		>
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
					<h3 className="font-sans text-[18px] font-semibold text-inverse line-clamp-2 mb-3">
						{agent.name || "Untitled"}
					</h3>

					{/* Description */}
					{/* TODO: Render agent descriptions once backend data is available. */}
					{agent.description ? (
						<p className="mb-2 font-geist text-[13px] text-link-muted line-clamp-2">
							{agent.description}
						</p>
					) : null}

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
																<Tooltip
																	text={
																		<div className="flex flex-col gap-1 bg-bg-900/30 rounded px-2 py-0.5 border border-white/20">
																			{repos.slice(1).map((hiddenRepo) => (
																				<span key={hiddenRepo}>
																					{hiddenRepo}
																				</span>
																			))}
																		</div>
																	}
																	variant="dark"
																	side="top"
																>
																	<button
																		type="button"
																		className="relative z-50 font-geist text-[11px] text-text/60 flex-shrink-0 px-1.5 py-0.5 rounded-lg border border-border-muted"
																		onClick={(e) => {
																			e.stopPropagation();
																			e.preventDefault();
																		}}
																	>
																		+{repos.length - 1}
																	</button>
																</Tooltip>
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
																<Tooltip
																	text={
																		<div className="flex flex-col gap-1 bg-bg-900/30 rounded px-2 py-0.5 border border-white/20">
																			{files.slice(1).map((hiddenFile) => (
																				<span key={hiddenFile}>
																					{hiddenFile}
																				</span>
																			))}
																		</div>
																	}
																	variant="dark"
																	side="top"
																>
																	<button
																		type="button"
																		className="relative z-50 font-geist text-[11px] text-text/60 flex-shrink-0 px-1.5 py-0.5 rounded-lg border border-border-muted"
																		onClick={(e) => {
																			e.stopPropagation();
																			e.preventDefault();
																		}}
																	>
																		+{files.length - 1}
																	</button>
																</Tooltip>
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
							{agent.hasGithubIntegration && (
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
								by{" "}
								{agent.metadata.sample
									? "Giselle Team"
									: agent.creator?.displayName || "Unknown"}
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
