import {
	SettingDetail,
	SettingLabel,
} from "@giselle-internal/ui/setting-label";
import {
	type ActionNode,
	type Input,
	InputId,
	OutputId,
} from "@giselle-sdk/data-type";
import { type GitHubActionCommandId, githubActions } from "@giselle-sdk/flow";
import type { GitHubIntegrationInstallation } from "@giselle-sdk/giselle";
import {
	useIntegration,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle/react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { GitHubIcon, SpinnerIcon } from "../../../icons";
// Import icons from GitHub trigger components
import {
	DiscussionCommentCreatedIcon,
	IssueCommentCreatedIcon,
	IssueCreatedIcon,
	PullRequestCommentCreatedIcon,
	PullRequestReviewCommentCreatedIcon,
} from "../trigger-node-properties-panel/providers/github-trigger/components/icons";
import { GitHubRepositoryBlock } from "../trigger-node-properties-panel/ui";
import { SelectRepository } from "../ui";
import { GenerationPanel } from "./generation-panel";
import { GitHubActionConfiguredView } from "./ui/github-action-configured-view";

// Default icon for actions without specific icons
const DefaultActionIcon = ({
	size = 18,
	className = "text-inverse",
}: {
	size?: number;
	className?: string;
}) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		className={className}
		aria-label="GitHub Action"
	>
		<title>GitHub Action</title>
		<path
			d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"
			fill="currentColor"
		/>
	</svg>
);

// Arrow right icon for action buttons
const ArrowRightIcon = () => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 16 16"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		className="text-inverse group-hover:text-inverse transition-colors"
	>
		<title>Arrow Right</title>
		<path
			d="M6 4L10 8L6 12"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

// Map action IDs to their corresponding icons
const getActionIcon = (actionId: string) => {
	const iconProps = { size: 18, className: "text-inverse" };

	switch (actionId) {
		case "github.create.issue":
			return <IssueCreatedIcon {...iconProps} />;
		case "github.create.issueComment":
			return <IssueCommentCreatedIcon {...iconProps} />;
		case "github.create.pullRequestComment":
			return <PullRequestCommentCreatedIcon {...iconProps} />;
		case "github.reply.pullRequestReviewComment":
			return <PullRequestReviewCommentCreatedIcon {...iconProps} />;
		case "github.get.discussion":
			return <DefaultActionIcon {...iconProps} />;
		case "github.create.discussionComment":
			return <DiscussionCommentCreatedIcon {...iconProps} />;
		default:
			return <DefaultActionIcon {...iconProps} />;
	}
};

export function GitHubActionPropertiesPanel({ node }: { node: ActionNode }) {
	const { value } = useIntegration();

	// Only handle GitHub actions
	if (node.content.command.provider !== "github") {
		return null;
	}

	if (node.content.command.state.status === "configured") {
		return (
			<div className="flex flex-col h-full">
				<GitHubActionConfiguredView
					state={node.content.command.state}
					node={node}
					inputs={node.inputs}
				/>
				<div className="p-4">
					<GenerationPanel node={node} />
				</div>
			</div>
		);
	} else if (
		node.content.command.state.status === "reconfiguring" &&
		value?.github?.status === "installed"
	) {
		return (
			<Installed
				installations={value.github.installations}
				node={node}
				installationUrl={value.github.installationUrl}
				reconfigStep={{
					state: "select-repository",
				}}
			/>
		);
	}

	if (value?.github === undefined) {
		return "unset";
	}
	switch (value.github.status) {
		case "unset":
			return "unset";
		case "unauthorized":
			return <Unauthorized authUrl={value.github.authUrl} />;
		case "not-installed":
			return (
				<InstallGitHubApplication
					installationUrl={value.github.installationUrl}
				/>
			);
		case "invalid-credential":
			return "invalid-credential";
		case "installed":
			return (
				<Installed
					installations={value.github.installations}
					node={node}
					installationUrl={value.github.installationUrl}
				/>
			);
		case "error":
			return `GitHub integration error: ${value.github.errorMessage}`;
		default: {
			const _exhaustiveCheck: never = value.github;
			throw new Error(`Unhandled status: ${_exhaustiveCheck}`);
		}
	}
}

function Unauthorized({ authUrl }: { authUrl: string }) {
	const { refresh } = useIntegration();
	const [isPending, startTransition] = useTransition();
	const popupRef = useRef<Window | null>(null);

	// Handler for installation message from popup window
	const handleInstallationMessage = useCallback(
		(event: MessageEvent) => {
			if (event.data?.type === "github-app-installed") {
				startTransition(() => {
					refresh();
				});
			}
		},
		[refresh],
	);

	// Listen for visibility changes to refresh data when user returns to the page
	useEffect(() => {
		// Add event listener for installation message from popup
		window.addEventListener("message", handleInstallationMessage);

		return () => {
			window.removeEventListener("message", handleInstallationMessage);

			// Close popup if component unmounts
			if (popupRef.current && !popupRef.current.closed) {
				popupRef.current.close();
			}
		};
	}, [handleInstallationMessage]);

	const handleClick = useCallback(() => {
		const width = 800;
		const height = 800;
		const left = window.screenX + (window.outerWidth - width) / 2;
		const top = window.screenY + (window.outerHeight - height) / 2;

		popupRef.current = window.open(
			authUrl,
			"Configure GitHub App",
			`width=${width},height=${height},top=${top},left=${left},popup=1`,
		);

		if (!popupRef.current) {
			console.warn("Failed to open popup window");
			return;
		}
	}, [authUrl]);

	return (
		<div className="bg-surface/10 h-[300px] rounded-[8px] flex items-center justify-center">
			<div className="flex flex-col gap-[8px]">
				<p>Sign in to your GitHub account to get started</p>
				<button
					type="button"
					className="group cursor-pointer bg-bg rounded-[4px] py-[4px] flex items-center justify-center gap-[8px] disabled:opacity-50 disabled:cursor-wait"
					onClick={handleClick}
					disabled={isPending}
				>
					<GitHubIcon className="size-[18px]" />
					Continue with GitHub
					<SpinnerIcon className="hidden group-disabled:block animate-follow-through-overlap-spin" />
				</button>
			</div>
		</div>
	);
}

function InstallGitHubApplication({
	installationUrl,
}: {
	installationUrl: string;
}) {
	const [isPending, startTransition] = useTransition();
	const { refresh } = useIntegration();
	const popupRef = useRef<Window | null>(null);
	const handleClick = useCallback(() => {
		const width = 800;
		const height = 800;
		const left = window.screenX + (window.outerWidth - width) / 2;
		const top = window.screenY + (window.outerHeight - height) / 2;

		popupRef.current = window.open(
			installationUrl,
			"Configure GitHub App",
			`width=${width},height=${height},top=${top},left=${left},popup=1`,
		);

		if (!popupRef.current) {
			console.warn("Failed to open popup window");
			return;
		}
	}, [installationUrl]);

	// Handler for installation message from popup window
	const handleInstallationMessage = useCallback(
		(event: MessageEvent) => {
			if (event.data?.type === "github-app-installed") {
				startTransition(() => {
					refresh();
				});
			}
		},
		[refresh],
	);

	// Listen for visibility changes to refresh data when user returns to the page
	useEffect(() => {
		// Add event listener for installation message from popup
		window.addEventListener("message", handleInstallationMessage);

		return () => {
			window.removeEventListener("message", handleInstallationMessage);

			// Close popup if component unmounts
			if (popupRef.current && !popupRef.current.closed) {
				popupRef.current.close();
			}
		};
	}, [handleInstallationMessage]);
	return (
		<div className="bg-surface/10 h-[300px] rounded-[8px] flex items-center justify-center">
			<div className="flex flex-col gap-[8px]">
				<p>
					Install the GitHub application for the accounts you wish to perform
					actions with
				</p>
				<button
					type="button"
					className="group cursor-pointer bg-bg rounded-[4px] py-[4px] flex items-center justify-center gap-[8px] disabled:opacity-50 disabled:cursor-wait"
					onClick={handleClick}
					disabled={isPending}
				>
					<GitHubIcon className="size-[18px]" />
					Install
					<SpinnerIcon className="hidden group-disabled:block animate-follow-through-overlap-spin" />
				</button>
			</div>
		</div>
	);
}

interface SelectRepositoryStep {
	state: "select-repository";
}
interface SelectActionStep {
	state: "select-action";
	owner: string;
	repo: string;
	repoNodeId: string;
	installationId: number;
}
interface ConfigureActionStep {
	state: "configure-action";
	owner: string;
	repo: string;
	repoNodeId: string;
	installationId: number;
	actionId: string;
}
type GitHubActionSetupStep =
	| SelectRepositoryStep
	| SelectActionStep
	| ConfigureActionStep;

function Installed({
	installations,
	node,
	installationUrl,
	reconfigStep,
}: {
	installations: GitHubIntegrationInstallation[];
	node: ActionNode;
	installationUrl: string;
	reconfigStep?: SelectRepositoryStep;
}) {
	const [step, setStep] = useState<GitHubActionSetupStep>(
		reconfigStep ?? {
			state: "select-repository",
		},
	);
	const { updateNodeData } = useWorkflowDesigner();
	const [selectedInstallationId, setSelectedInstallationId] = useState<
		number | null
	>(null);

	const handleActionSelect = useCallback(
		(commandId: string) => {
			if (step.state !== "select-action") {
				throw new Error("Unexpected state");
			}

			/** @todo remove type assertion */
			const action = githubActions[commandId as GitHubActionCommandId];

			// Setup inputs and outputs for the action
			const inputs: Input[] = [];

			// Add inputs based on the action type
			for (const key of action.command.parameters.keyof().options) {
				// @ts-expect-error shape[parameter] is unreasonable but intentional
				const schema = action.command.parameters.shape[key] as AnyZodObject;
				inputs.push({
					id: InputId.generate(),
					accessor: key,
					label: key,
					isRequired: !schema.isOptional(),
				});
			}

			updateNodeData(node, {
				content: {
					...node.content,
					command: {
						...node.content.command,
						provider: "github",
						state: {
							status: "configured",
							commandId: action.command.id,
							repositoryNodeId: step.repoNodeId,
							installationId: step.installationId,
						},
					},
				},
				name: action.command.label,
				inputs,
				outputs: [
					{
						id: OutputId.generate(),
						label: "output",
						accessor: "action-result",
					},
				],
			});
		},
		[node, updateNodeData, step],
	);

	const handleSelectRepository = useCallback(
		(value: {
			installationId: number;
			owner: string;
			repo: string;
			repoNodeId: string;
		}) => {
			if (node.content.command.state.status === "unconfigured") {
				// For new configuration: proceed to next step (action selection)
				setStep({
					state: "select-action",
					installationId: value.installationId,
					owner: value.owner,
					repo: value.repo,
					repoNodeId: value.repoNodeId,
				});
			} else if (node.content.command.state.status === "reconfiguring") {
				// For reconfiguration: change repository and complete configuration
				updateNodeData(node, {
					content: {
						...node.content,
						command: {
							...node.content.command,
							provider: "github",
							state: {
								...node.content.command.state,
								status: "configured",
								repositoryNodeId: value.repoNodeId,
								installationId: value.installationId,
							},
						},
					},
				});
			} else {
				throw new Error(
					`Unexpected status: ${node.content.command.state.status}`,
				);
			}
		},
		[node, updateNodeData],
	);

	return (
		<div className="overflow-y-auto flex flex-1 flex-col gap-[16px] px-[4px]">
			{step.state === "select-repository" && (
				<>
					<div className="flex w-full items-center gap-[12px]">
						<div className="shrink-0 w-[120px]">
							<SettingDetail className="mb-0">Organization</SettingDetail>
						</div>
						<div className="grow min-w-0">
							<SelectRepository
								installations={installations}
								installationUrl={installationUrl}
								onSelectRepository={handleSelectRepository}
								showMissingAccountLink={false}
								renderRepositories={false}
								onChangeInstallation={setSelectedInstallationId}
							/>
						</div>
					</div>
					<p className="text-inverse text-[12px] text-right mb-3">
						Missing GitHub account?
						<a
							href={installationUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="text-inverse hover:text-inverse ml-1 underline text-[12px]"
						>
							Adjust GitHub App Permissions
						</a>
					</p>
					{selectedInstallationId !== null && (
						<div className="flex w-full items-start gap-[12px]">
							<div className="shrink-0 w-[120px]">
								<SettingDetail className="mb-0">Repository</SettingDetail>
							</div>
							<div className="grow min-w-0">
								<div className="flex flex-col gap-y-[8px] relative">
									{(
										installations.find((i) => i.id === selectedInstallationId)
											?.repositories ?? []
									).map((repo) => (
										<button
											key={repo.node_id}
											type="button"
											className="group relative rounded-[12px] overflow-hidden px-[16px] py-[12px] w-full border-[0.5px] border-white/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(255,255,255,0.15)] hover:border-white/12 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(255,255,255,0.2)] transition-all duration-200 cursor-pointer text-left"
											onClick={() => {
												setStep({
													state: "select-action",
													installationId: selectedInstallationId,
													owner: repo.owner.login,
													repo: repo.name,
													repoNodeId: repo.node_id,
												});
											}}
										>
											<div className="invisible group-hover:visible absolute right-4 top-1/2 transform -translate-y-1/2 bg-bg-800 text-inverse text-xs px-2 py-1 rounded whitespace-nowrap">
												Select
											</div>
											<div className="flex items-center justify-between">
												<div className="flex flex-col">
													<div className="flex items-center gap-2">
														<span className="text-inverse font-medium text-[14px]">
															{repo.name}
														</span>
														<span className="rounded-full px-1.5 py-px text-black-300 font-medium text-[10px] leading-normal font-geist border-[0.5px] border-black-400">
															{repo.private ? "Private" : "Public"}
														</span>
													</div>
												</div>
											</div>
										</button>
									))}
								</div>
								<p className="text-inverse text-[12px] text-right">
									Missing Git repository?
									<a
										href={installationUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-inverse hover:text-inverse ml-1 underline text-[12px]"
									>
										Adjust GitHub App Permissions
									</a>
								</p>
							</div>
						</div>
					)}
				</>
			)}
			{step.state === "select-action" && (
				<div className="w-full flex flex-col gap-[16px]">
					<GitHubRepositoryBlock owner={step.owner} repo={step.repo} />
					<div className="flex flex-col gap-[4px] flex-1 overflow-hidden">
						<SettingLabel className="mb-[4px]">Action Type</SettingLabel>
						<div className="flex flex-col gap-[8px] overflow-y-auto pr-2 pl-0 pt-[8px] custom-scrollbar flex-1">
							{Object.entries(githubActions).map(([id, githubAction]) => (
								<button
									key={id}
									type="button"
									className="flex items-center py-[8px] px-[8px] rounded-lg group w-full min-h-[48px] border border-inverse/20 hover:border-inverse/30 hover:bg-inverse/10 transition-colors"
									onClick={() => handleActionSelect(id)}
								>
									<div className="flex items-center min-w-0 flex-1">
										<div className="p-2 rounded-lg mr-3 bg-bg/10 group-hover:bg-bg/20 transition-colors flex-shrink-0 flex items-center justify-center">
											{getActionIcon(id)}
										</div>
										<div className="flex flex-col text-left overflow-hidden min-w-0">
											<span className="text-inverse font-medium text-[14px] truncate">
												{githubAction.command.label}
											</span>
											<span className="text-text-muted text-[10px] truncate group-hover:text-inverse transition-colors pr-6">
												{`Perform ${githubAction.command.label.toLowerCase()} action`}
											</span>
										</div>
									</div>
									{/* Removed right arrow icon for consistency with trigger list */}
								</button>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
