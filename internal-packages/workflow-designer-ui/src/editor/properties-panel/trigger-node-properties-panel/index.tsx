import type { TriggerNode } from "@giselle-sdk/data-type";
import {
	WorkspaceGitHubIntegrationNextAction,
	WorkspaceGitHubIntegrationPayloadField,
	type WorkspaceGitHubIntegrationPayloadNodeMap,
	WorkspaceGitHubIntegrationTrigger,
} from "@giselle-sdk/data-type";
import type { GitHubIntegrationRepository } from "@giselle-sdk/integration";
import { useIntegration } from "@giselle-sdk/integration/react";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { MousePointerClickIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useMemo, useState, useTransition } from "react";
import { GitHubIcon, SpinnerIcon } from "../../../icons";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../ui/select";
import { Label } from "../../../settings/ui/label";
import { PayloadMapForm } from "../../../settings/github-integration/payload-map-form";
import {
	PropertiesPanelContent,
	PropertiesPanelHeader,
	PropertiesPanelRoot,
} from "../ui";
import { useDebug } from "../../debug-context";

// 型定義
type WorkspaceGitHubIntegrationNextActionType = 
	| "github.issue_comment.create"
	| "github.pull_request_comment.create";

const NEXT_ACTION_DISPLAY_NAMES: Record<
	WorkspaceGitHubIntegrationNextActionType,
	string
> = {
	"github.issue_comment.create": "Create Issue Comment",
	"github.pull_request_comment.create": "Create Pull Request Comment",
} as const;

const TRIGGER_TO_ACTIONS: Record<
	string,
	WorkspaceGitHubIntegrationNextActionType[]
> = {
	"github.issues.opened": ["github.issue_comment.create"],
	"github.issue_comment.created": ["github.issue_comment.create"],
	"github.pull_request_comment.created": ["github.pull_request_comment.create"],
	"github.issues.closed": ["github.issue_comment.create"],
	"github.pull_request.opened": ["github.pull_request_comment.create"],
	"github.pull_request.ready_for_review": [
		"github.pull_request_comment.create",
	],
	"github.pull_request.closed": ["github.pull_request_comment.create"],
} as const;

const TRIGGERS_REQUIRING_CALLSIGN: readonly WorkspaceGitHubIntegrationTrigger[] =
	[
		"github.issue_comment.created",
		"github.pull_request_comment.created",
	] as const;

type TriggerRequiringCallsign = (typeof TRIGGERS_REQUIRING_CALLSIGN)[number];

function isTriggerRequiringCallsign(
	trigger: WorkspaceGitHubIntegrationTrigger,
): trigger is TriggerRequiringCallsign {
	return TRIGGERS_REQUIRING_CALLSIGN.includes(
		trigger as TriggerRequiringCallsign,
	);
}

const getAvailablePayloadFields = (
	trigger: WorkspaceGitHubIntegrationTrigger,
) => {
	const fields = Object.values(WorkspaceGitHubIntegrationPayloadField.Enum);
	const triggerParts = trigger.split(".");
	const triggerPrefix = `${triggerParts[0]}.${triggerParts[1]}.`;
	return fields.filter((field) => field.startsWith(triggerPrefix));
};

const getAvailableNextActions = (trigger: WorkspaceGitHubIntegrationTrigger) => {
	return TRIGGER_TO_ACTIONS[trigger] ?? [];
};

// GitHub認証コンポーネント
function GitHubConnections({
	authUrl,
	onClose
}: {
	authUrl: string;
	onClose?: () => void;
}) {
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

	// Listen for message events
	useEffect(() => {
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
		<div className="relative p-0 pt-2 rounded-lg flex flex-col items-center text-white-900">
			{onClose && (
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-gray-500 hover:text-white-900"
					aria-label="Close"
				>
					<XIcon size={20} />
				</button>
			)}
			
			<GitHubIcon className="size-[40px] mt-0 mb-6" />
			
			<h2 className="text-[#F5F5F5] text-center font-['Hubot_Sans'] text-[20px] font-semibold leading-[140%] mb-8">GitHub Connections</h2>
			
			<h3 className="text-[#F5F5F5] text-center font-['Hubot_Sans'] text-[16px] font-bold leading-normal mb-4">How will GitHub connections work?</h3>
			
			<p className="text-[#F5F5F5] text-center font-['Geist'] text-[12px] font-medium leading-[170%] mb-10 max-w-md">
				You will be able to connect a GitHub repository to a Giselle's App. The GitHub app will watch for changes to your repository such as file changes, branch changes as well as pull request activity.
			</p>
			
			<button
				type="button"
				className="flex items-start justify-center gap-[4px] border border-[#F5F5F5] text-[#F5F5F5] rounded-[30px] py-[8px] px-[16px] font-medium cursor-pointer hover:bg-white-900/10 transition-colors disabled:opacity-50 disabled:cursor-wait"
				onClick={handleClick}
				disabled={isPending}
			>
				Add new App connection
				{isPending && <SpinnerIcon className="animate-follow-through-overlap-spin ml-2" />}
			</button>
		</div>
	);
}

// GitHubアプリインストールコンポーネント
function GitHubInstallApp({
	installationUrl,
	onClose
}: {
	installationUrl: string;
	onClose?: () => void;
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

	// Listen for message events
	useEffect(() => {
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
		<div className="relative p-0 pt-2 rounded-lg flex flex-col items-center text-white-900">
			{onClose && (
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-gray-500 hover:text-white-900"
					aria-label="Close"
				>
					<XIcon size={20} />
				</button>
			)}
			
			<GitHubIcon className="size-[40px] mt-0 mb-6" />
			
			<h2 className="text-[#F5F5F5] text-center font-['Hubot_Sans'] text-[20px] font-semibold leading-[140%] mb-8">GitHub Connections</h2>
			
			<h3 className="text-[#F5F5F5] text-center font-['Hubot_Sans'] text-[16px] font-bold leading-normal mb-4">Choose repositories</h3>
			
			<p className="text-[#F5F5F5] text-center font-['Geist'] text-[12px] font-medium leading-[170%] mb-10 max-w-md">
				Select the repositories you want to connect with Giselle's App. You can choose to install on all repositories or select specific ones.
			</p>
			
			<button
				type="button"
				className="flex items-start justify-center gap-[4px] border border-[#F5F5F5] text-[#F5F5F5] rounded-[30px] py-[8px] px-[16px] font-medium cursor-pointer hover:bg-white-900/10 transition-colors disabled:opacity-50 disabled:cursor-wait"
				onClick={handleClick}
				disabled={isPending}
			>
				Select repositories
				{isPending && <SpinnerIcon className="animate-follow-through-overlap-spin ml-2" />}
			</button>
		</div>
	);
}

export function TriggerNodePropertiesPanel({ node }: { node: TriggerNode }) {
	const { updateNodeData, data } = useWorkflowDesigner();
	const { value } = useIntegration();
	const { githubAuthState } = useDebug();
	const [selectedTrigger, setSelectedTrigger] = useState<
		WorkspaceGitHubIntegrationTrigger | undefined
	>(undefined);
	const [callsign, setCallsign] = useState("");
	const [selectedNextAction, setSelectedNextAction] = useState<
		WorkspaceGitHubIntegrationNextActionType | undefined
	>(undefined);
	const [payloadMaps, setPayloadMaps] = useState<
		WorkspaceGitHubIntegrationPayloadNodeMap[]
	>([]);
	
	// Select icon based on trigger type
	const getTriggerIcon = () => {
		switch (node.content.provider.type) {
			case "github":
				return <GitHubIcon className="size-[20px] text-black-900" />;
			case "manual":
				return <MousePointerClickIcon className="size-[20px] text-black-900" />;
			default:
				return <MousePointerClickIcon className="size-[20px] text-black-900" />;
		}
	};

	// GitHub integration repository list
	const repositories = useMemo(() => {
		if (value?.github?.status === 'installed') {
			return value.github.repositories;
		}
		return [];
	}, [value?.github]);

	// Available payload fields based on selected trigger
	const availablePayloadFields = useMemo(
		() => (selectedTrigger ? getAvailablePayloadFields(selectedTrigger) : []),
		[selectedTrigger],
	);

	// Available actions based on selected trigger
	const availableNextActions = useMemo(
		() => (selectedTrigger ? getAvailableNextActions(selectedTrigger) : []),
		[selectedTrigger],
	);

	// Trigger change handler
	const handleTriggerChange = useCallback(
		(value: string) => {
			const newTrigger = WorkspaceGitHubIntegrationTrigger.safeParse(value);
			if (!newTrigger.success) {
				setSelectedTrigger(undefined);
				setCallsign("");
				setPayloadMaps([]);
				setSelectedNextAction(undefined);
				return;
			}

			const newTriggerValue = newTrigger.data;
			const currentTrigger = selectedTrigger;
			setSelectedTrigger(newTriggerValue);

			if (newTriggerValue !== currentTrigger) {
				if (!isTriggerRequiringCallsign(newTriggerValue)) {
					setCallsign("");
				}

				const availableActions = getAvailableNextActions(newTriggerValue);
				if (
					selectedNextAction &&
					!availableActions.includes(selectedNextAction)
				) {
					setSelectedNextAction(undefined);
				}
			}
		},
		[selectedTrigger, selectedNextAction],
	);

	// Render content based on GitHub auth state
	const renderGitHubContent = () => {
		// Prioritize debug state if set
		let github = value?.github;
		
		// If debug mode is active (not default), override with debug status
		if (githubAuthState !== 'default') {
			github = { 
				...value?.github, 
				status: githubAuthState === 'unauthorized' ? 'unauthorized' : 
						githubAuthState === 'not-installed' ? 'not-installed' : 'installed',
				authUrl: "/api/integrations/github/auth", 
				installationUrl: "/api/integrations/github/install" 
			} as typeof value.github;
		}
		
		// Display connection panel if GitHub info is missing or unset
		if (!github || github.status === "unset") {
			// Use default auth URL
			const defaultAuthUrl = "/api/integrations/github/auth";
			return <GitHubConnections authUrl={defaultAuthUrl} />;
		}
		
		// Handle cases where github exists and status is not "unset"
		switch (github.status) {
			case "unauthorized":
				return <GitHubConnections authUrl={github.authUrl} />;
			case "not-installed":
				return (
					<div className="flex flex-col gap-[17px] p-0">
						<div className="space-y-[4px]">
							<p className="text-[14px] py-[1.5px]">Repository Type</p>
							<Select>
								<SelectTrigger>
									<SelectValue placeholder="Select repository type" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectItem value="public">Public Repository</SelectItem>
										<SelectItem value="private">Private Repository</SelectItem>
										<SelectItem value="all">All Repositories</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
						
						<div className="space-y-[4px]">
							<p className="text-[14px] py-[1.5px]">Event Type</p>
							<Select>
								<SelectTrigger>
									<SelectValue placeholder="Select event type" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectItem value="push">Push Event</SelectItem>
										<SelectItem value="pull_request">Pull Request Event</SelectItem>
										<SelectItem value="issue">Issue Event</SelectItem>
										<SelectItem value="comment">Comment Event</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
						
						<div className="space-y-[4px]">
							<p className="text-[14px] py-[1.5px]">Call sign</p>
							<input
								type="text"
								className="prompt-editor border-[0.5px] border-white-900 rounded-[8px] px-[16px] w-full h-[38px] bg-transparent text-[14px] outline-none placeholder:text-white-400/70 flex items-center"
								placeholder="Your personal call sign (e.g. /Giselle)"
							/>
							<p className="text-[12px] text-white-400">This trigger activates only when someone mentions this call sign on GitHub</p>
						</div>
						
						<div className="flex justify-end mt-2">
							<button
								type="button"
								className="h-[38px] rounded-[8px] bg-white-800 text-[14px] cursor-pointer text-black-800 font-[700] px-[16px] font-accent flex items-center justify-center"
								onClick={() => {
									// Save implementation
									console.log("Save button clicked");
								}}
							>
								Save
							</button>
						</div>
					</div>
				);
			case "invalid-credential":
				return (
					<div className="flex-1 flex flex-col items-center justify-center">
						<p className="text-yellow-500 mb-4">GitHub authentication credentials are invalid</p>
						<button
							type="button"
							className="bg-white-900 text-black-900 rounded-lg py-2 px-4 font-medium"
							onClick={() => {
								// Re-authentication process
							}}
						>
							Re-authenticate
						</button>
					</div>
				);
			case "installed":
				return (
					<div className="flex flex-col gap-[17px] p-0">
						<div className="space-y-[4px]">
							<p className="text-[14px] py-[1.5px] text-white-400">Repository Type</p>
							<div className="px-[16px] py-[9px] w-full bg-transparent text-[14px]">
								Public Repository
							</div>
						</div>
						
						<div className="space-y-[4px]">
							<p className="text-[14px] py-[1.5px] text-white-400">Event Type</p>
							<div className="px-[16px] py-[9px] w-full bg-transparent text-[14px]">
								Push Event
							</div>
						</div>
						
						<div className="space-y-[4px]">
							<p className="text-[14px] py-[1.5px] text-white-400">Call sign</p>
							<div className="px-[16px] py-[9px] w-full bg-transparent text-[14px]">
								/Giselle
							</div>
						</div>
					</div>
				);
			default:
				return null;
		}
	};

	return (
		<div className="h-full">
			<PropertiesPanelRoot>
				<PropertiesPanelHeader
					icon={getTriggerIcon()}
					node={node}
					description={"Trigger"}
					onChangeName={(name) => {
						updateNodeData(node, { name });
					}}
				/>
				<PropertiesPanelContent>
					{node.content.provider.type === "manual" && (
						<div className="p-4">
							<h3 className="text-lg font-semibold mb-2">Trigger Settings</h3>
							<p>Trigger Type: {node.content.provider.type}</p>
							<p className="mt-2">Manual Trigger ID: {node.content.provider.triggerId}</p>
						</div>
					)}

					{node.content.provider.type === "github" && (
						<div className="p-0 flex flex-col">
							{renderGitHubContent()}
						</div>
					)}
				</PropertiesPanelContent>
			</PropertiesPanelRoot>
		</div>
	);
} 