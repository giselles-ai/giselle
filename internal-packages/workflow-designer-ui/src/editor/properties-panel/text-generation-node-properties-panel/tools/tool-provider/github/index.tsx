import { Button } from "@giselle-internal/ui/button";
import { EmptyState } from "@giselle-internal/ui/empty-state";
import { Input } from "@giselle-internal/ui/input";
import { Select } from "@giselle-internal/ui/select";
import type { TextGenerationNode } from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "@giselle-sdk/giselle/react";
import {
	CheckIcon,
	MoveUpRightIcon,
	PlusIcon,
	RefreshCwIcon,
	Settings2Icon,
	TrashIcon,
} from "lucide-react";
import { Checkbox } from "radix-ui";
import { useCallback, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import {
	ToolConfigurationDialog,
	type ToolConfigurationDialogProps,
} from "../../ui/tool-configuration-dialog";
import {
	ToolProviderSecretTypeValue,
	useToolProviderConnection,
} from "../use-tool-provider-connection";

const secretTags = ["github-access-token"];

// Helper function to display token info with label
function getTokenDisplay(
	secretId: string,
	secrets: { id: string; label: string }[],
): string {
	const secret = secrets.find((s) => s.id === secretId);
	if (secret) {
		return secret.label;
	}

	// This should not happen - indicates data inconsistency
	return "⚠️ Token missing - please update";
}

// GitHub token validation
function isValidGitHubPAT(token: string): boolean {
	// GitHub token formats:
	// Classic PAT: ghp_ followed by 36 alphanumeric characters (total 40 chars)
	// Fine-grained PAT: github_pat_ followed by 82 alphanumeric characters (total 93 chars)
	// OAuth token: gho_ followed by 36 alphanumeric characters (total 40 chars)
	return /^(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82}|gho_[a-zA-Z0-9]{36})$/.test(
		token,
	);
}

export function GitHubToolConfigurationDialog({
	node,
}: {
	node: TextGenerationNode;
}) {
	const [showUpdateDialog, setShowUpdateDialog] = useState(false);

	const {
		presentDialog,
		setPresentDialog,
		tabValue,
		setTabValue,
		isPending,
		isConfigured,
		isLoading,
		secrets,
		handleSubmit,
		currentSecretId,
	} = useToolProviderConnection({
		secretTags,
		toolKey: "github",
		node,
		buildToolConfig: (secretId) => ({
			tools: node.content.tools?.github?.tools ?? [],
			auth: { type: "secret", secretId },
		}),
		isUpdatingExistingConfiguration: showUpdateDialog,
	});

	const handleUpdateSubmit = useCallback<
		React.FormEventHandler<HTMLFormElement>
	>(
		(e) => {
			if (!e.currentTarget.checkValidity()) {
				e.preventDefault();
				return;
			}

			handleSubmit(e);
			setShowUpdateDialog(false);
		},
		[handleSubmit],
	);

	if (!isConfigured) {
		return (
			<GitHubToolConnectionDialog
				open={presentDialog}
				onOpenChange={setPresentDialog}
				tabValue={tabValue}
				setTabValue={setTabValue}
				isPending={isPending}
				isLoading={isLoading}
				secrets={secrets}
				onSubmit={handleSubmit}
			/>
		);
	}

	return (
		<>
			<GitHubToolConfigurationDialogInternal
				node={node}
				open={presentDialog}
				onOpenChange={setPresentDialog}
				onShowUpdateDialog={() => setShowUpdateDialog(true)}
				secrets={secrets}
				currentSecretId={currentSecretId}
			/>
			<GitHubToolConnectionDialog
				open={showUpdateDialog}
				onOpenChange={setShowUpdateDialog}
				tabValue={tabValue}
				setTabValue={setTabValue}
				isPending={isPending}
				isLoading={isLoading}
				secrets={secrets}
				onSubmit={handleUpdateSubmit}
				title="Update GitHub Token"
				description="How would you like to update your Personal Access Token (PAT)?"
				hideTrigger={true}
				submitText="Save"
			/>
		</>
	);
}

function GitHubToolConnectionDialog({
	open,
	onOpenChange,
	tabValue,
	setTabValue,
	isPending,
	isLoading,
	secrets,
	onSubmit,
	title = "Connect to GitHub",
	description = "How would you like to add your Personal Access Token (PAT)?",
	hideTrigger = false,
	submitText = "Save & Connect",
}: Pick<ToolConfigurationDialogProps, "open" | "onOpenChange"> & {
	tabValue: "create" | "select";
	setTabValue: React.Dispatch<React.SetStateAction<"create" | "select">>;
	isPending: boolean;
	isLoading: boolean;
	secrets: { id: string; label: string }[] | undefined;
	onSubmit: React.FormEventHandler<HTMLFormElement>;
	title?: string;
	description?: string;
	hideTrigger?: boolean;
	submitText?: string;
}) {
	const [tokenValue, setTokenValue] = useState("");
	const [tokenError, setTokenError] = useState<string | null>(null);

	const handleResetToken = () => {
		setTokenValue("");
		setTokenError(null);
	};

	const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setTokenValue(value);

		if (value && !isValidGitHubPAT(value)) {
			setTokenError(
				"Invalid token format. GitHub tokens should start with ghp_ (classic), github_pat_ (fine-grained), or gho_ (OAuth)",
			);
		} else {
			setTokenError(null);
		}
	};

	const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		if (tabValue === "create" && tokenValue && !isValidGitHubPAT(tokenValue)) {
			e.preventDefault();
			return;
		}

		if (tabValue === "select") {
			const formData = new FormData(e.currentTarget);
			const secretId = formData.get("secretId");
			if (!secretId || secretId === "") {
				e.preventDefault();
				return;
			}
		}

		onSubmit(e);
		handleResetToken();
	};

	const handleDialogOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) {
			handleResetToken();
		}
		onOpenChange?.(nextOpen);
	};

	return (
		<ToolConfigurationDialog
			title={title}
			description={description}
			onSubmit={handleFormSubmit}
			submitting={isPending}
			submitText={
				tabValue === "select" && (secrets ?? []).length < 1 ? "" : submitText
			}
			disabled={
				(tabValue === "create" && !!tokenError) ||
				(tabValue === "select" && (secrets ?? []).length < 1)
			}
			trigger={
				hideTrigger ? null : (
					<Button
						type="button"
						leftIcon={<PlusIcon data-dialog-trigger-icon />}
						variant="link"
					>
						Connect
					</Button>
				)
			}
			open={open}
			onOpenChange={handleDialogOpenChange}
		>
			<Tabs
				value={tabValue}
				onValueChange={(value) =>
					setTabValue(ToolProviderSecretTypeValue.parse(value))
				}
			>
				<TabsList className="mb-[12px]">
					<TabsTrigger value="create">Paste New Token</TabsTrigger>
					<TabsTrigger value="select">Use Saved Token</TabsTrigger>
				</TabsList>
				<TabsContent value="create">
					<Input
						type="hidden"
						name="secretType"
						value={ToolProviderSecretTypeValue.enum.create}
					/>
					<div className="flex flex-col gap-[12px]">
						<fieldset className="flex flex-col">
							<label htmlFor="label" className="text-text text-[13px] mb-[2px]">
								Token Name
							</label>
							<Input type="text" id="label" name="label" required />
							<p className="text-[11px] text-text-muted px-[4px] mt-[1px]">
								Give this token a short name (e.g. “Prod-bot”). You’ll use it
								when linking other nodes.
							</p>
						</fieldset>
						<fieldset className="flex flex-col">
							<div className="flex justify-between mb-[2px]">
								<label htmlFor="pat" className="text-text text-[13px]">
									Personal Access Token (PAT)
								</label>
								<div className="flex items-end pb-[3px]">
									<a
										href="https://github.com/settings/personal-access-tokens"
										className="flex items-center gap-[4px] text-[13px] text-text-muted transition-colors px-[1px] leading-[13px] pb-[0px] border-b border-transparent hover:border-text-muted"
										target="_blank"
										rel="noopener noreferrer"
										tabIndex={-1}
									>
										<span>GitHub</span>
										<MoveUpRightIcon className="size-[13px]" />
									</a>
								</div>
							</div>
							<Input
								type="password"
								autoComplete="off"
								data-1p-ignore
								data-lpignore="true"
								id="pat"
								name="value"
								value={tokenValue}
								onChange={handleTokenChange}
								aria-invalid={!!tokenError}
								aria-describedby={tokenError ? "pat-error" : undefined}
								required
							/>
							{tokenError ? (
								<p
									id="pat-error"
									className="text-[11px] text-red-600 px-[4px] mt-[1px]"
									role="alert"
								>
									{tokenError}
								</p>
							) : (
								<p className="text-[11px] text-text-muted px-[4px] mt-[1px]">
									We'll encrypt the token with authenticated encryption before
									saving it.
								</p>
							)}
						</fieldset>
					</div>
				</TabsContent>
				<TabsContent value="select">
					{isLoading ? (
						<p>Loading...</p>
					) : (secrets ?? []).length < 1 ? (
						<div className="h-[184px] flex flex-col items-center justify-center">
							<div className="flex-1 flex items-center justify-center">
								<EmptyState description="No saved tokens." />
							</div>
							<div>
								<Button
									onClick={() => setTabValue("create")}
									leftIcon={<PlusIcon />}
									variant="glass"
								>
									Add a Token
								</Button>
							</div>
						</div>
					) : (
						<>
							<p className="text-[11px] text-text-muted my-[4px]">
								Pick one of your encrypted tokens to connect.
							</p>
							<Input
								type="hidden"
								name="secretType"
								value={ToolProviderSecretTypeValue.enum.select}
							/>
							<fieldset className="flex flex-col">
								<label
									htmlFor="label"
									className="text-text text-[13px] mb-[2px]"
								>
									Select a Saved Token
								</label>
								<div>
									<Select
										name="secretId"
										placeholder="Choose a token… "
										options={secrets?.map((s) => ({ ...s, value: s.id })) ?? []}
										renderOption={(option) => option.label}
										widthClassName="w-[180px]"
									/>
								</div>
							</fieldset>
						</>
					)}
				</TabsContent>
			</Tabs>
		</ToolConfigurationDialog>
	);
}

const githubToolCatalog = [
	{
		label: "Repository",
		tools: ["getFileContents", "listBranches"],
	},
	{
		label: "Issues",
		tools: [
			"createIssue",
			"getIssue",
			"listIssues",
			"updateIssue",
			"addIssueComment",
			"getIssueComments",
		],
	},
	{
		label: "Pull Requests",
		tools: [
			"createPullRequest",
			"getPullRequest",
			"updatePullRequest",
			"listPullRequests",
			"getPullRequestComments",
			"getPullRequestFiles",
			"getPullRequestReviews",
			"getPullRequestStatus",
			"createPullRequestReview",
			"addPullRequestReviewComment",
			"mergePullRequest",
			"updatePullRequestBranch",
		],
	},
	{
		label: "Code Management",
		tools: ["createBranch", "createOrUpdateFile", "getCommit", "listCommits"],
	},
	{
		label: "Search",
		tools: [
			"searchCode",
			"searchIssues",
			"searchPullRequests",
			"searchRepositories",
			"searchUsers",
		],
	},
	// {
	// 	label: "User",
	// 	tools: ["getMe"],
	// },
];

function GitHubToolConfigurationDialogInternal({
	node,
	open,
	onOpenChange,
	onShowUpdateDialog,
	secrets,
	currentSecretId,
}: Pick<ToolConfigurationDialogProps, "open" | "onOpenChange"> & {
	node: TextGenerationNode;
	onShowUpdateDialog: () => void;
	secrets: { id: string; label: string }[] | undefined;
	currentSecretId: string | undefined;
}) {
	const { updateNodeDataContent } = useWorkflowDesigner();

	const updateAvailableTools = useCallback<
		React.FormEventHandler<HTMLFormElement>
	>(
		(e) => {
			e.preventDefault();
			if (node.content.tools?.github === undefined) {
				return;
			}
			const formData = new FormData(e.currentTarget);

			const tools = formData
				.getAll("tools")
				.filter((tool) => typeof tool === "string");
			updateNodeDataContent(node, {
				...node.content,
				tools: {
					...node.content.tools,
					github: {
						...node.content.tools.github,
						tools,
					},
				},
			});
			onOpenChange?.(false);
		},
		[node, updateNodeDataContent, onOpenChange],
	);

	return (
		<ToolConfigurationDialog
			title="GitHub Configuration"
			description="Select the GitHub tools you want to enable."
			onSubmit={updateAvailableTools}
			submitting={false}
			trigger={
				<Button
					type="button"
					leftIcon={<Settings2Icon data-dialog-trigger-icon />}
				>
					Configure
				</Button>
			}
			open={open}
			onOpenChange={onOpenChange}
		>
			<div className="flex flex-col">
				{/* Inline credentials info */}
				<div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
					<div className="flex items-center gap-[8px]">
						<span className="text-[11px] text-text-muted">Current PAT:</span>
						<span className="text-[11px] text-text px-[6px] py-[1px] bg-background-variant border border-border rounded-[4px] font-medium">
							{currentSecretId && secrets
								? getTokenDisplay(currentSecretId, secrets)
								: "Not configured"}
						</span>
					</div>
					<div className="flex gap-[8px]">
						<Button
							type="button"
							onClick={onShowUpdateDialog}
							disabled={!currentSecretId}
							size="compact"
							variant="outline"
							leftIcon={<RefreshCwIcon className="size-[12px]" />}
						>
							Update
						</Button>
						<Button
							type="button"
							onClick={() => {
								const { github: _removed, ...otherTools } =
									node.content.tools || {};
								updateNodeDataContent(node, {
									...node.content,
									tools: otherTools,
								});
								onOpenChange?.(false);
							}}
							leftIcon={<TrashIcon className="size-[12px]" />}
							size="compact"
							variant="outline"
						>
							Reset
						</Button>
					</div>
				</div>
				<div className="flex flex-col gap-6">
					{githubToolCatalog.map((category) => (
						<div key={category.label} className="flex flex-col gap-2">
							<div className="text-[13px] font-medium text-text">
								{category.label}
							</div>
							<div className="flex flex-col gap-1 border border-border-variant rounded-[4px] overflow-hidden">
								{category.tools.map((tool) => (
									<label
										key={tool}
										className="flex items-center justify-between p-3 hover:bg-black-800/30 cursor-pointer transition-colors"
										htmlFor={tool}
									>
										<div className="flex items-center flex-1">
											<Checkbox.Root
												className="group appearance-none size-[18px] rounded border flex items-center justify-center transition-colors outline-none data-[state=checked]:border-success data-[state=checked]:bg-success"
												value={tool}
												id={tool}
												defaultChecked={
													!!node.content.tools?.github?.tools?.includes(tool)
												}
												name="tools"
											>
												<Checkbox.Indicator className="text-background">
													<CheckIcon className="size-[16px]" />
												</Checkbox.Indicator>
											</Checkbox.Root>
											<p className="text-sm text-text flex-1 pl-[8px]">
												{tool}
											</p>
										</div>
										<a
											href={`https://docs.giselles.ai/glossary/github-tools#${encodeURIComponent(
												tool.toLowerCase(),
											)}`}
											target="_blank"
											rel="noopener"
											aria-label={`Open docs for ${tool}`}
											className="flex items-center gap-[4px] text-[13px] text-text-muted hover:bg-ghost-element-hover transition-colors px-[4px] rounded-[2px] ml-2"
											onMouseDown={(e) => e.stopPropagation()}
											onClick={(e) => e.stopPropagation()}
										>
											<span>Docs</span>
											<MoveUpRightIcon className="size-[13px]" />
										</a>
									</label>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</ToolConfigurationDialog>
	);
}
