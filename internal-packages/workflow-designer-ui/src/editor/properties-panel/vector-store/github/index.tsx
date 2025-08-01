import type { VectorStoreNode } from "@giselle-sdk/data-type";
import {
	useVectorStore,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle/react";
import { Check, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { TriangleAlert } from "../../../../icons";
import { useGitHubVectorStoreStatus } from "../../../lib/use-github-vector-store-status";

type GitHubVectorStoreNodePropertiesPanelProps = {
	node: VectorStoreNode;
};

export function GitHubVectorStoreNodePropertiesPanel({
	node,
}: GitHubVectorStoreNodePropertiesPanelProps) {
	const { updateNodeDataContent } = useWorkflowDesigner();
	const vectorStore = useVectorStore();
	const settingPath = vectorStore?.settingPath;

	// Get repository indexes
	const githubRepositoryIndexes = vectorStore?.githubRepositoryIndexes ?? [];

	// Current content type from node (if configured)
	const currentContentType =
		node.content.source.state.status === "configured"
			? node.content.source.state.contentType
			: undefined;

	const { isOrphaned, repositoryId } = useGitHubVectorStoreStatus(node);
	const [isOpen, setIsOpen] = useState(false);
	const [selectedContentType, setSelectedContentType] = useState<
		"blob" | "pull_request" | undefined
	>(currentContentType);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Get all unique repositories
	const allRepositories = useMemo(() => {
		return githubRepositoryIndexes.map((repo) => ({
			...repo,
			availableTypes: new Set(repo.availableContentTypes),
		}));
	}, [githubRepositoryIndexes]);

	const selectedRepository = allRepositories.find(
		(repo) => repo.id === repositoryId,
	);

	const handleRepositoryChange = (selectedKey: string) => {
		const selectedRepo = allRepositories.find(
			(repo) => `${repo.owner}/${repo.repo}` === selectedKey,
		);
		if (selectedRepo) {
			// Reset content type selection when repository changes
			setSelectedContentType(undefined);
			// Update to unconfigured state until content type is selected
			updateNodeDataContent(node, {
				...node.content,
				source: {
					...node.content.source,
					state: {
						status: "unconfigured",
					},
				},
			});
		}
		// Store selected repository for later use
		setSelectedRepoKey(selectedKey);
	};

	const [selectedRepoKey, setSelectedRepoKey] = useState<string | undefined>(
		selectedRepository
			? `${selectedRepository.owner}/${selectedRepository.repo}`
			: undefined,
	);

	const handleContentTypeChange = (contentType: "blob" | "pull_request") => {
		const selectedRepo = allRepositories.find(
			(repo) => `${repo.owner}/${repo.repo}` === selectedRepoKey,
		);
		if (selectedRepo) {
			setSelectedContentType(contentType);
			updateNodeDataContent(node, {
				...node.content,
				source: {
					...node.content.source,
					state: {
						status: "configured",
						owner: selectedRepo.owner,
						repo: selectedRepo.repo,
						contentType,
					},
				},
			});
		}
	};

	// Handle click outside to close dropdown
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	// Handle escape key to close dropdown
	useEffect(() => {
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener("keydown", handleEscape);
		}

		return () => {
			document.removeEventListener("keydown", handleEscape);
		};
	}, [isOpen]);

	return (
		<div className="flex flex-col gap-[17px] p-0">
			<div className="space-y-[4px]">
				<p className="text-[14px] py-[1.5px] text-white-400">
					GitHub Repository
				</p>
				{isOrphaned && node.content.source.state.status === "configured" && (
					<div className="flex items-center gap-[6px] text-error-900 text-[13px] mb-[8px]">
						<TriangleAlert className="size-[16px]" />
						<span>
							The repository{" "}
							<span className="font-mono font-semibold">
								{node.content.source.state.owner}/
								{node.content.source.state.repo}
							</span>{" "}
							is no longer available in your Vector Stores. Please select a
							different repository or set up this repository again.
						</span>
					</div>
				)}
				<div className="relative" ref={dropdownRef}>
					<button
						type="button"
						onClick={() => setIsOpen(!isOpen)}
						className="w-full px-3 py-2 bg-black-300/20 rounded-[8px] text-white-400 text-[14px] font-geist cursor-pointer text-left flex items-center justify-between"
					>
						<span className={selectedRepoKey ? "" : "text-white/30"}>
							{selectedRepoKey || "Select a repository"}
						</span>
						<ChevronDown className="h-4 w-4 text-white/60" />
					</button>
					{isOpen && (
						<div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-[8px] border-[0.25px] border-white/10 bg-black-850 p-1 shadow-none">
							{allRepositories.map((repo) => {
								const repoKey = `${repo.owner}/${repo.repo}`;
								return (
									<button
										key={repoKey}
										type="button"
										onClick={() => {
											handleRepositoryChange(repoKey);
											setIsOpen(false);
										}}
										className="flex w-full items-center rounded-md px-3 py-2 text-left font-sans text-[14px] leading-[16px] text-white-400 hover:bg-white/5"
									>
										<span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
											{selectedRepoKey === repoKey && (
												<Check className="h-4 w-4" />
											)}
										</span>
										{repoKey}
									</button>
								);
							})}
						</div>
					)}
				</div>

				{/* Content Type Selection */}
				{selectedRepoKey && (
					<div className="mt-[16px]">
						<p className="text-[14px] py-[1.5px] text-white-400 mb-[8px]">
							Content Type
						</p>
						<div className="space-y-[8px]">
							{(() => {
								const selectedRepo = allRepositories.find(
									(repo) => `${repo.owner}/${repo.repo}` === selectedRepoKey,
								);
								if (!selectedRepo) return null;

								const hasBlobContent = selectedRepo.availableTypes.has("blob");
								const hasPullRequestContent =
									selectedRepo.availableTypes.has("pull_request");

								return (
									<>
										<label
											className={`flex items-center space-x-3 cursor-pointer ${
												!hasBlobContent ? "opacity-50 cursor-not-allowed" : ""
											}`}
										>
											<input
												type="radio"
												name="contentType"
												value="blob"
												checked={selectedContentType === "blob"}
												onChange={() => handleContentTypeChange("blob")}
												disabled={!hasBlobContent}
												className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500"
											/>
											<span className="text-[14px] text-white-400">Code</span>
											{!hasBlobContent && (
												<span className="text-[12px] text-white-400/50">
													(Not configured)
												</span>
											)}
										</label>
										<label
											className={`flex items-center space-x-3 cursor-pointer ${
												!hasPullRequestContent
													? "opacity-50 cursor-not-allowed"
													: ""
											}`}
										>
											<input
												type="radio"
												name="contentType"
												value="pull_request"
												checked={selectedContentType === "pull_request"}
												onChange={() => handleContentTypeChange("pull_request")}
												disabled={!hasPullRequestContent}
												className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500"
											/>
											<span className="text-[14px] text-white-400">
												Pull Requests
											</span>
											{!hasPullRequestContent && (
												<span className="text-[12px] text-white-400/50">
													(Not configured)
												</span>
											)}
										</label>
									</>
								);
							})()}
						</div>
					</div>
				)}

				{settingPath && (
					<div className="pt-[8px] flex justify-end">
						<Link
							href={settingPath}
							className="text-white-400 hover:text-white-300 text-[14px] underline"
						>
							Set Up Vector Store
						</Link>
					</div>
				)}
			</div>
		</div>
	);
}
