import { Select } from "@giselle-internal/ui/select";
import type {
	EmbeddingProfileId,
	GitHubVectorStoreSource,
	VectorStoreNode,
} from "@giselle-sdk/data-type";
import {
	DEFAULT_EMBEDDING_PROFILE_ID,
	EMBEDDING_PROFILES,
	isEmbeddingProfileId,
} from "@giselle-sdk/data-type";
import {
	useVectorStore,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle/react";
import { Info } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { TriangleAlert } from "../../../../icons";
import { useGitHubVectorStoreStatus } from "../../../lib/use-github-vector-store-status";

type GitHubVectorStoreNodePropertiesPanelProps = {
	node: VectorStoreNode;
};

export function GitHubVectorStoreNodePropertiesPanel({
	node,
}: GitHubVectorStoreNodePropertiesPanelProps) {
	const { updateNodeData } = useWorkflowDesigner();
	const vectorStore = useVectorStore();
	const settingPath = vectorStore?.githubSettingPath;

	// Get repository indexes
	const githubRepositoryIndexes = vectorStore?.githubRepositoryIndexes ?? [];

	// This component is GitHub-specific
	const source = node.content.source as GitHubVectorStoreSource;

	// Current content type from node (if configured)
	const currentContentType =
		source.state.status === "configured" ? source.state.contentType : undefined;

	const { isOrphaned, repositoryId, isEmbeddingProfileOrphaned } =
		useGitHubVectorStoreStatus(node);
	const [selectedContentType, setSelectedContentType] = useState<
		"blob" | "pull_request" | undefined
	>(currentContentType);
	const [selectedEmbeddingProfileId, setSelectedEmbeddingProfileId] = useState<
		EmbeddingProfileId | undefined
	>(
		source.state.status === "configured"
			? source.state.embeddingProfileId
			: undefined,
	);

	// Get all unique repositories
	const allRepositories = useMemo(() => {
		return githubRepositoryIndexes.map((repo) => ({
			...repo,
		}));
	}, [githubRepositoryIndexes]);

	const selectedRepository = useMemo(() => {
		return allRepositories.find((repo) => repo.id === repositoryId);
	}, [allRepositories, repositoryId]);

	const repositoryOptions = useMemo(() => {
		return allRepositories.map((repo) => ({
			value: `${repo.owner}/${repo.repo}`,
			label: `${repo.owner}/${repo.repo}`,
		}));
	}, [allRepositories]);

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
						provider: "github",
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

	const contentTypeAvailability = useMemo(() => {
		const selectedRepo = allRepositories.find(
			(repo) => `${repo.owner}/${repo.repo}` === selectedRepoKey,
		);
		if (!selectedRepo)
			return { hasBlobContent: false, hasPullRequestContent: false };

		return {
			hasBlobContent:
				selectedRepo.contentTypes?.some(
					(ct: { contentType: string }) => ct.contentType === "blob",
				) ?? false,
			hasPullRequestContent:
				selectedRepo.contentTypes?.some(
					(ct: { contentType: string }) => ct.contentType === "pull_request",
				) ?? false,
		};
	}, [allRepositories, selectedRepoKey]);

	const availableEmbeddingProfiles = useMemo(() => {
		const selectedRepo = allRepositories.find(
			(repo) => `${repo.owner}/${repo.repo}` === selectedRepoKey,
		);
		if (!selectedRepo || !selectedContentType) return [];

		const contentTypeProfiles = selectedRepo.contentTypes?.find(
			(ct: { contentType: string }) => ct.contentType === selectedContentType,
		);

		return (contentTypeProfiles?.embeddingProfileIds || []).filter(
			(id): id is EmbeddingProfileId => isEmbeddingProfileId(id),
		);
	}, [allRepositories, selectedRepoKey, selectedContentType]);

	const embeddingProfileOptions = useMemo(() => {
		return availableEmbeddingProfiles
			.sort((a, b) => a - b)
			.map((profileId: EmbeddingProfileId) => {
				const profile =
					EMBEDDING_PROFILES[profileId as keyof typeof EMBEDDING_PROFILES];
				if (!profile)
					return {
						value: profileId,
						label: `Profile ${profileId}`,
					};
				return {
					value: profileId,
					label: `${profile.name} (${profile.dimensions} dimensions)`,
				};
			});
	}, [availableEmbeddingProfiles]);

	const defaultEmbeddingProfileValue = useMemo(() => {
		return (
			selectedEmbeddingProfileId?.toString() ||
			availableEmbeddingProfiles.sort((a, b) => a - b)[0]?.toString()
		);
	}, [selectedEmbeddingProfileId, availableEmbeddingProfiles]);

	const handleContentTypeChange = (contentType: "blob" | "pull_request") => {
		const selectedRepo = allRepositories.find(
			(repo) => `${repo.owner}/${repo.repo}` === selectedRepoKey,
		);
		if (selectedRepo) {
			setSelectedContentType(contentType);

			// Set default embedding profile
			// When feature flag is off, always use DEFAULT_EMBEDDING_PROFILE_ID
			// When feature flag is on, use first available profile for the content type
			let profileId: EmbeddingProfileId = DEFAULT_EMBEDDING_PROFILE_ID;
			if (selectedRepo.contentTypes) {
				const contentTypeProfiles = selectedRepo.contentTypes.find(
					(ct: { contentType: string }) => ct.contentType === contentType,
				);
				if (
					contentTypeProfiles &&
					contentTypeProfiles.embeddingProfileIds.length > 0
				) {
					// Sort profile IDs and take the first one
					const sortedProfileIds = [
						...contentTypeProfiles.embeddingProfileIds,
					].sort((a, b) => a - b);
					const firstId = sortedProfileIds[0];
					if (isEmbeddingProfileId(firstId)) {
						profileId = firstId;
					}
				}
			}
			setSelectedEmbeddingProfileId(profileId);

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
						provider: "github",
						state: {
							status: "configured",
							owner: selectedRepo.owner,
							repo: selectedRepo.repo,
							contentType,
							embeddingProfileId: profileId,
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
				{isOrphaned && source.state.status === "configured" && (
					<div className="flex items-center gap-[6px] text-error-900 text-[13px] mb-[8px]">
						<TriangleAlert className="size-[16px]" />
						<span>
							The repository{" "}
							<span className="font-mono font-semibold">
								{source.state.owner}/{source.state.repo}
							</span>{" "}
							is no longer available in your Vector Stores. Please select a
							different repository or set up this repository again.
						</span>
					</div>
				)}
				<Select
					value={selectedRepoKey || ""}
					onValueChange={handleRepositoryChange}
					options={repositoryOptions}
					placeholder="Select a repository"
				/>

				{/* Content Type Selection */}
				{selectedRepoKey && (
					<div className="mt-[16px]">
						<p className="text-[14px] py-[1.5px] text-white-400 mb-[8px]">
							Content Type
						</p>
						<div className="space-y-[8px]">
							{(() => {
								const { hasBlobContent, hasPullRequestContent } =
									contentTypeAvailability;

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

				{/* Embedding Profile Selection */}
				{selectedRepoKey &&
					selectedContentType &&
					availableEmbeddingProfiles.length > 0 && (
						<div className="mt-[16px]">
							<p className="text-[14px] py-[1.5px] text-white-400 mb-[8px]">
								Embedding Model
							</p>
							{isEmbeddingProfileOrphaned &&
								source.state.status === "configured" && (
									<div className="flex items-center gap-[6px] text-error-900 text-[13px] mb-[8px]">
										<TriangleAlert className="size-[16px]" />
										<span>
											The selected embedding model is no longer available for
											this content type. Please select a different model.
										</span>
									</div>
								)}
							<Select
								options={embeddingProfileOptions}
								placeholder="Select embedding model..."
								value={defaultEmbeddingProfileValue}
								onValueChange={(value) => {
									const maybeId = Number(value);
									if (!isEmbeddingProfileId(maybeId)) return;
									setSelectedEmbeddingProfileId(maybeId);

									// Update node data with selected profile
									if (source.state.status === "configured") {
										updateNodeData(node, {
											content: {
												...node.content,
												source: {
													provider: "github",
													state: {
														...source.state,
														embeddingProfileId: maybeId,
													},
												},
											},
										});
									}
								}}
							/>
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
