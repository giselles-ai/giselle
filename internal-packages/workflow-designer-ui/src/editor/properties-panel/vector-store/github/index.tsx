import type { VectorStoreNode } from "@giselle-sdk/data-type";
import {
	useVectorStore,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle/react";
import { Info } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { TriangleAlert } from "../../../../icons";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../../ui/select";
import { useGitHubVectorStoreStatus } from "../../../lib/use-github-vector-store-status";

type GitHubVectorStoreNodePropertiesPanelProps = {
	node: VectorStoreNode;
};

export function GitHubVectorStoreNodePropertiesPanel({
	node,
}: GitHubVectorStoreNodePropertiesPanelProps) {
	const { updateNodeData } = useWorkflowDesigner();
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
	const [selectedContentType, setSelectedContentType] = useState<
		"blob" | "pull_request" | undefined
	>(currentContentType);

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

			// Reset output label to default
			const updatedOutputs = [...node.outputs];
			if (updatedOutputs[0]) {
				updatedOutputs[0] = {
					...updatedOutputs[0],
					label: "Output",
				};
			}

			// Update to unconfigured state until content type is selected
			updateNodeData(node, {
				outputs: updatedOutputs,
				content: {
					...node.content,
					source: {
						...node.content.source,
						state: {
							status: "unconfigured",
						},
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

			// Update output label based on content type
			const updatedOutputs = [...node.outputs];
			if (updatedOutputs[0]) {
				updatedOutputs[0] = {
					...updatedOutputs[0],
					label: contentType === "pull_request" ? "Pull Requests" : "Code",
				};
			}

			updateNodeData(node, {
				outputs: updatedOutputs,
				content: {
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
				},
			});
		}
	};

	return (
		<div className="flex flex-col gap-[17px] p-0">
			<div className="space-y-[4px]">
				<p className="text-[14px] py-[1.5px] text-white-400">
					GitHub Repository
				</p>
				{githubRepositoryIndexes.length === 0 && (
					<div className="text-[12px] text-white-400/60 mb-[8px]">
						No repositories available. Please check your GitHub integration in
						settings.
					</div>
				)}
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
				<Select value={selectedRepoKey} onValueChange={handleRepositoryChange}>
					<SelectTrigger className="w-full px-3 py-2 bg-black-300/20 rounded-[8px] text-white-400 text-[14px] font-geist cursor-pointer text-left border-none">
						<SelectValue placeholder="Select a repository" />
					</SelectTrigger>
					<SelectContent className="bg-black-850 border-[0.25px] border-white/10">
						{allRepositories.map((repo) => {
							const repoKey = `${repo.owner}/${repo.repo}`;
							return (
								<SelectItem
									key={repoKey}
									value={repoKey}
									className="px-3 py-2 text-left font-sans text-[14px] leading-[16px] text-white-400 hover:bg-white/5"
								>
									{repoKey}
								</SelectItem>
							);
						})}
					</SelectContent>
				</Select>

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
												<div className="flex items-center gap-1 group relative">
													<span className="text-[12px] text-white-400/50">
														Not configured
													</span>
													<Info className="w-3 h-3 text-white-400/50 cursor-help" />
													<div className="absolute left-0 bottom-full mb-2 px-3 py-2 bg-black-800/80 backdrop-blur-md border border-white/10 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
														Enable Code for {selectedRepoKey} in Vector Store
														settings
													</div>
												</div>
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
												<div className="flex items-center gap-1 group relative">
													<span className="text-[12px] text-white-400/50">
														Not configured
													</span>
													<Info className="w-3 h-3 text-white-400/50 cursor-help" />
													<div className="absolute left-0 bottom-full mb-2 px-3 py-2 bg-black-800/80 backdrop-blur-md border border-white/10 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
														Enable Pull Requests for that repository in Vector
														Store settings
													</div>
												</div>
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
