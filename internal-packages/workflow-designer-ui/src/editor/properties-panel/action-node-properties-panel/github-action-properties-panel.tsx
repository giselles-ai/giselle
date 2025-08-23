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
	className = "text-white",
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
		className="text-white-400 group-hover:text-white-300 transition-colors"
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
	const iconProps = { size: 18, className: "text-white" };

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
		<div className="bg-white-900/10 h-[300px] rounded-[8px] flex items-center justify-center">
			<div className="flex flex-col gap-[8px]">
				<p>Sign in to your GitHub account to get started</p>
				<button
					type="button"
					className="group cursor-pointer bg-black-900 rounded-[4px] py-[4px] flex items-center justify-center gap-[8px] disabled:opacity-50 disabled:cursor-wait"
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
		<div className="bg-white-900/10 h-[300px] rounded-[8px] flex items-center justify-center">
			<div className="flex flex-col gap-[8px]">
				<p>
					Install the GitHub application for the accounts you wish to perform
					actions with
				</p>
				<button
					type="button"
					className="group cursor-pointer bg-black-900 rounded-[4px] py-[4px] flex items-center justify-center gap-[8px] disabled:opacity-50 disabled:cursor-wait"
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
				const action = githubActions[node.content.command.state.commandId];
				const inputs: Input[] = [];
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
								repositoryNodeId: value.repoNodeId,
								installationId: value.installationId,
							},
						},
					},
					name: action.command.label,
					inputs: node.inputs ?? inputs,
					outputs: node.outputs ?? [
						{
							id: OutputId.generate(),
							label: "output",
							accessor: "action-result",
						},
					],
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
		<div className="flex flex-col gap-[16px] px-[4px]">
			<p className="text-[14px] py-[1.5px] text-[#F7F9FD]">Organization</p>
			{step.state === "select-repository" && (
				<SelectRepository
					installations={installations}
					installationUrl={installationUrl}
					onSelectRepository={handleSelectRepository}
				/>
			)}
			{step.state === "select-action" && (
				<div className="w-full flex flex-col gap-[16px]">
					<GitHubRepositoryBlock owner={step.owner} repo={step.repo} />
					<div className="flex flex-col gap-[4px] flex-1 overflow-hidden">
						<p className="text-[14px] py-[1.5px] text-[#F7F9FD]">Action Type</p>
						<div className="flex flex-col gap-[16px] overflow-y-auto pr-2 pl-0 pt-[8px] custom-scrollbar flex-1">
							{Object.entries(githubActions).map(([id, githubAction]) => (
								<button
									key={id}
									type="button"
									className="flex items-center py-[12px] px-[8px] rounded-lg group w-full h-[48px]"
									onClick={() => handleActionSelect(id)}
								>
									<div className="flex items-center min-w-0 flex-1">
										<div className="p-2 rounded-lg mr-3 bg-white/10 group-hover:bg-white/20 transition-colors flex-shrink-0 flex items-center justify-center">
											{getActionIcon(id)}
										</div>
										<div className="flex flex-col text-left overflow-hidden min-w-0">
											<span className="text-white-800 font-medium text-[14px] truncate">
												{githubAction.command.label}
											</span>
											<span className="text-white-400 text-[12px] truncate group-hover:text-white-300 transition-colors pr-6">
												{`Perform ${githubAction.command.label.toLowerCase()} action`}
											</span>
										</div>
									</div>
									<ArrowRightIcon />
								</button>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
