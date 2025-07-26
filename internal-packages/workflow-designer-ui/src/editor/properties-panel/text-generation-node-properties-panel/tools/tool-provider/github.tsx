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
	Settings2Icon,
	TrashIcon,
} from "lucide-react";
import { Checkbox } from "radix-ui";
import { useCallback, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
	ToolConfigurationDialog,
	type ToolConfigurationDialogProps,
} from "../ui/tool-configuration-dialog";
import {
	ToolProviderSecretTypeValue,
	useToolProviderConnection,
} from "./use-tool-provider-connection";

const secretTags = ["github-access-token"];

// GitHub Personal Access Token validation
function isValidGitHubPAT(token: string): boolean {
	// GitHub PAT formats (personal access tokens only):
	// Classic PAT: ghp_ followed by 36 alphanumeric characters (total 40 chars)
	// Fine-grained PAT: github_pat_ followed by 82 alphanumeric characters (total 93 chars)
	return /^(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82})$/.test(token);
}

export function GitHubToolConfigurationDialog({
	node,
}: {
	node: TextGenerationNode;
}) {
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
	} = useToolProviderConnection({
		secretTags,
		toolKey: "github",
		node,
		buildToolConfig: (secretId) => ({
			tools: [],
			auth: { type: "secret", secretId },
		}),
	});

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
		<GitHubToolConfigurationDialogInternal
			node={node}
			open={presentDialog}
			onOpenChange={setPresentDialog}
		/>
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
}: Pick<ToolConfigurationDialogProps, "open" | "onOpenChange"> & {
	tabValue: "create" | "select";
	setTabValue: React.Dispatch<React.SetStateAction<"create" | "select">>;
	isPending: boolean;
	isLoading: boolean;
	secrets: { id: string; label: string }[] | undefined;
	onSubmit: React.FormEventHandler<HTMLFormElement>;
}) {
	const [tokenValue, setTokenValue] = useState("");
	const [tokenError, setTokenError] = useState<string | null>(null);

	const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setTokenValue(value);

		if (value && !isValidGitHubPAT(value)) {
			setTokenError(
				"Invalid token format. GitHub Personal Access Tokens should start with ghp_ (classic) or github_pat_ (fine-grained)",
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
		onSubmit(e);
	};

	return (
		<ToolConfigurationDialog
			title="Connect to GitHub"
			description="How would you like to add your Personal Access Token (PAT)?"
			onSubmit={handleFormSubmit}
			submitting={isPending}
			trigger={
				<Button type="button" leftIcon={<PlusIcon data-dialog-trigger-icon />}>
					Connect
				</Button>
			}
			open={open}
			onOpenChange={onOpenChange}
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
							<Input type="text" id="label" name="label" />
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
								<a
									href="https://github.com/settings/personal-access-tokens"
									className="flex items-center gap-[4px] text-[13px] text-text-muted hover:bg-ghost-element-hover transition-colors px-[4px] rounded-[2px]"
									target="_blank"
									rel="noreferrer"
									tabIndex={-1}
								>
									<span>GitHub</span>
									<MoveUpRightIcon className="size-[13px]" />
								</a>
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
						<EmptyState description="No saved tokens.">
							<Button
								onClick={() => setTabValue("create")}
								leftIcon={<PlusIcon />}
							>
								Add a Token
							</Button>
						</EmptyState>
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
		tools: [
			"createRepository",
			"forkRepository",
			"getFileContents",
			"listBranches",
		],
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
		tools: [
			"createBranch",
			"createOrUpdateFile",
			"getCommit",
			"listCommits",
			"listCodeScanningAlerts",
			"getCodeScanningAlert",
		],
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
}: Pick<ToolConfigurationDialogProps, "open" | "onOpenChange"> & {
	node: TextGenerationNode;
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
				<div className="flex justify-between items-center border border-border rounded-[4px] px-[6px] py-[3px] text-[13px] mb-[16px]">
					<div className="flex gap-[6px] items-center">
						<CheckIcon className="size-[14px] text-green-900" />
						Token configured.
					</div>
					<Button
						type="button"
						onClick={() => {
							updateNodeDataContent(node, {
								...node.content,
								tools: {
									...node.content.tools,
									github: undefined,
								},
							});
						}}
						leftIcon={<TrashIcon className="size-[12px]" />}
						size="compact"
					>
						Reset
					</Button>
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
										<Checkbox.Root
											className="group appearance-none size-[18px] rounded border flex items-center justify-center transition-colors outline-none data-[state=checked]:border-success data-[state=checked]:bg-success"
											value={tool}
											id={tool}
											defaultChecked={node.content.tools?.github?.tools.includes(
												tool,
											)}
											name="tools"
										>
											<Checkbox.Indicator className="text-background">
												<CheckIcon className="size-[16px]" />
											</Checkbox.Indicator>
										</Checkbox.Root>
										<p className="text-sm text-text flex-1 pl-[8px]">{tool}</p>
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
