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
		<div className="relative p-[32px] rounded-lg flex flex-col items-center text-white-900">
			{onClose && (
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-gray-500 hover:text-white-900"
					aria-label="Close"
				>
					<XIcon size={20} />
				</button>
			)}
			
			<GitHubIcon className="size-[40px] mb-6" />
			
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
		<div className="relative p-[32px] rounded-lg flex flex-col items-center text-white-900">
			{onClose && (
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-gray-500 hover:text-white-900"
					aria-label="Close"
				>
					<XIcon size={20} />
				</button>
			)}
			
			<GitHubIcon className="size-[40px] mb-6" />
			
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
	
	// トリガータイプに基づいてアイコンを選択
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

	// GitHub統合のリポジトリリスト
	const repositories = useMemo(() => {
		if (value?.github?.status === 'installed') {
			return value.github.repositories;
		}
		return [];
	}, [value?.github]);

	// 選択中のトリガーに基づく利用可能なペイロードフィールド
	const availablePayloadFields = useMemo(
		() => (selectedTrigger ? getAvailablePayloadFields(selectedTrigger) : []),
		[selectedTrigger],
	);

	// 選択中のトリガーに基づく利用可能なアクション
	const availableNextActions = useMemo(
		() => (selectedTrigger ? getAvailableNextActions(selectedTrigger) : []),
		[selectedTrigger],
	);

	// トリガー変更ハンドラー
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

	// GitHub認証状態に基づくコンテンツレンダリング
	const renderGitHubContent = () => {
		// デバッグ状態が設定されている場合はそれを優先
		let github = value?.github;
		
		// デバッグモードが有効（デフォルト以外）の場合は、デバッグ用のステータスで上書き
		if (githubAuthState !== 'default') {
			github = { 
				...value?.github, 
				status: githubAuthState === 'unauthorized' ? 'unauthorized' : 
						githubAuthState === 'not-installed' ? 'not-installed' : 'installed',
				authUrl: "/api/integrations/github/auth", 
				installationUrl: "/api/integrations/github/install" 
			} as typeof value.github;
		}
		
		// GitHub情報がない場合やステータスが未設定の場合は接続パネルを表示
		if (!github || github.status === "unset") {
			// デフォルトの認証URLを使用
			const defaultAuthUrl = "/api/integrations/github/auth";
			return <GitHubConnections authUrl={defaultAuthUrl} />;
		}
		
		// ここからは github が存在し、status が "unset" 以外の場合の処理
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
							<textarea
								className="prompt-editor border-[0.5px] border-white-900 rounded-[8px] p-[16px] w-full h-[100px] bg-transparent text-[14px] outline-none placeholder:text-white-400/70 resize-none"
								placeholder="Your personal call sign (e.g. /Giselle)"
							/>
							<p className="text-[12px] text-white-400">This trigger activates only when someone mentions this call sign on GitHub</p>
						</div>
						
						<div className="flex justify-end mt-2">
							<button
								type="button"
								className="h-[38px] rounded-[8px] bg-white-800 text-[14px] cursor-pointer text-black-800 font-[700] px-[16px] font-accent flex items-center justify-center"
								onClick={() => {
									// インストールページへのリダイレクト
									if (github?.installationUrl) {
										const width = 800;
										const height = 800;
										const left = window.screenX + (window.outerWidth - width) / 2;
										const top = window.screenY + (window.outerHeight - height) / 2;
										
										window.open(
											github.installationUrl,
											"Configure GitHub App",
											`width=${width},height=${height},top=${top},left=${left},popup=1`
										);
									}
								}}
							>
								Continue
							</button>
						</div>
					</div>
				);
			case "invalid-credential":
				return (
					<div className="flex-1 flex flex-col items-center justify-center">
						<p className="text-yellow-500 mb-4">GitHub認証情報が無効です</p>
						<button
							type="button"
							className="bg-white-900 text-black-900 rounded-lg py-2 px-4 font-medium"
							onClick={() => {
								// 再認証処理
							}}
						>
							再認証する
						</button>
					</div>
				);
			case "installed":
				return (
					<div className="grid gap-y-4">
						<div>
							<Label>リポジトリ</Label>
							<Select>
								<SelectTrigger>
									<SelectValue placeholder="リポジトリを選択" />
								</SelectTrigger>
								<SelectContent>
									{repositories.map((repo) => (
										<SelectItem key={repo.node_id} value={repo.node_id}>
											{repo.full_name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label>イベント</Label>
							<Select onValueChange={handleTriggerChange}>
								<SelectTrigger>
									<SelectValue placeholder="トリガーを選択" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem
										value={
											WorkspaceGitHubIntegrationTrigger.Enum[
												"github.issues.opened"
											]
										}
									>
										issues.opened
									</SelectItem>
									<SelectItem
										value={
											WorkspaceGitHubIntegrationTrigger.Enum[
												"github.issues.closed"
											]
										}
									>
										issues.closed
									</SelectItem>
									<SelectItem
										value={
											WorkspaceGitHubIntegrationTrigger.Enum[
												"github.issue_comment.created"
											]
										}
									>
										issue_comment.created
									</SelectItem>
									<SelectItem
										value={
											WorkspaceGitHubIntegrationTrigger.Enum[
												"github.pull_request.opened"
											]
										}
									>
										pull_request.opened
									</SelectItem>
									<SelectItem
										value={
											WorkspaceGitHubIntegrationTrigger.Enum[
												"github.pull_request.ready_for_review"
											]
										}
									>
										pull_request.ready_for_review
									</SelectItem>
									<SelectItem
										value={
											WorkspaceGitHubIntegrationTrigger.Enum[
												"github.pull_request.closed"
											]
										}
									>
										pull_request.closed
									</SelectItem>
									<SelectItem
										value={
											WorkspaceGitHubIntegrationTrigger.Enum[
												"github.pull_request_comment.created"
											]
										}
									>
										pull_request_comment.created
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{selectedTrigger && isTriggerRequiringCallsign(selectedTrigger) && (
							<div>
								<Label>コールサイン</Label>
								<input
									type="text"
									className="bg-black-750 h-[28px] w-full border-[1px] border-white-950/10 flex items-center px-[12px] text-[12px] rounded-[8px] outline-none placeholder:text-white-400/70"
									value={callsign}
									onChange={(e) => setCallsign(e.target.value)}
									placeholder="@giselle など"
								/>
							</div>
						)}

						{selectedTrigger && (
							<div>
								<Label>データマッピング</Label>
								<PayloadMapForm
									nodes={data.nodes}
									currentPayloadMaps={payloadMaps}
									availablePayloadFields={availablePayloadFields}
								/>
							</div>
						)}

						{selectedTrigger && availableNextActions.length > 0 && (
							<div>
								<Label>アクション</Label>
								<Select
									value={selectedNextAction}
									onValueChange={(value) => {
										const nextAction = (value === "github.issue_comment.create" || value === "github.pull_request_comment.create") 
											? value as WorkspaceGitHubIntegrationNextActionType
											: undefined;
										setSelectedNextAction(nextAction);
									}}
								>
									<SelectTrigger>
										<SelectValue placeholder="アクションを選択" />
									</SelectTrigger>
									<SelectContent>
										{availableNextActions.map((action) => (
											<SelectItem key={action} value={action}>
												{NEXT_ACTION_DISPLAY_NAMES[action]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}

						<div className="flex justify-end mt-2">
							<button
								type="button"
								className="h-[28px] rounded-[8px] bg-white-800 text-[14px] cursor-pointer text-black-800 font-[700] px-[16px] font-accent"
								onClick={() => {
									// ここでノードに設定を保存する処理を実装
									if (selectedTrigger) {
										console.log("保存", {
											リポジトリ: repositories[0]?.node_id, // 選択中のリポジトリ
											イベント: selectedTrigger,
											コールサイン: callsign,
											アクション: selectedNextAction,
											データマッピング: payloadMaps,
										});
									}
								}}
							>
								保存
							</button>
						</div>
					</div>
				);
			default:
				return null;
		}
	};

	return (
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
						<h3 className="text-lg font-semibold mb-2">トリガー設定</h3>
						<p>トリガータイプ: {node.content.provider.type}</p>
						<p className="mt-2">手動トリガーID: {node.content.provider.triggerId}</p>
					</div>
				)}

				{node.content.provider.type === "github" && (
					<div className="py-4 px-2 h-full flex flex-col">
						{renderGitHubContent()}
					</div>
				)}
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
} 