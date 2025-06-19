import { SecretId, type TextGenerationNode } from "@giselle-sdk/data-type";
import clsx from "clsx/lite";
import { useGiselleEngine, useWorkflowDesigner } from "giselle-sdk/react";
import {
	CheckIcon,
	MoveUpRightIcon,
	PlusIcon,
	Settings2Icon,
} from "lucide-react";
import {
	type ComponentProps,
	type PropsWithChildren,
	type ReactNode,
	useCallback,
	useState,
	useTransition,
} from "react";
import { z } from "zod/v4";
import { useWorkspaceSecrets } from "../../../lib/use-workspace-secrets";
import { GitHubIcon } from "../../../tool";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";
import { EmptyState } from "./ui/empty-state";
import { Select } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

const GitHubToolSetupSecretType = {
	create: "create",
	select: "select",
} as const;
const GitHubToolSetupPayload = z.discriminatedUnion("secretType", [
	z.object({
		secretType: z.literal(GitHubToolSetupSecretType.create),
		label: z.string().min(1),
		value: z.string().min(1),
	}),
	z.object({
		secretType: z.literal(GitHubToolSetupSecretType.select),
		secretId: SecretId.schema,
	}),
]);

function GitHubToolSetting({ node }: { node: TextGenerationNode }) {
	const [presentDialog, setPresentDialog] = useState(false);
	const [tabValue, setTabValue] = useState("create");
	const { updateNodeDataContent, data: workspace } = useWorkflowDesigner();
	const { isLoading, data, mutate } = useWorkspaceSecrets();
	const client = useGiselleEngine();
	const [isPending, startTransition] = useTransition();
	const setupGitHubTool = useCallback<React.FormEventHandler<HTMLFormElement>>(
		(e) => {
			e.preventDefault();
			const formData = new FormData(e.currentTarget);
			const secretType = formData.get("secretType");
			const label = formData.get("label");
			const value = formData.get("value");
			const secretId = formData.get("secretId");
			const parse = GitHubToolSetupPayload.safeParse({
				secretType,
				label,
				value,
				secretId,
			});
			if (!parse.success) {
				/** @todo Implement error handling */
				console.log(parse.error);
				return;
			}
			const payload = parse.data;
			switch (payload.secretType) {
				case "create":
					startTransition(async () => {
						const result = await client.addSecret({
							workspaceId: workspace.id,
							label: payload.label,
							value: payload.value,
						});
						mutate([...(data ?? []), result.secret]);
						updateNodeDataContent(node, {
							...node.content,
							tools: {
								...node.content.tools,
								github: {
									tools: [],
									auth: {
										type: "secret",
										secretId: result.secret.id,
									},
								},
							},
						});
					});
					break;
				case "select":
					updateNodeDataContent(node, {
						...node.content,
						tools: {
							...node.content.tools,
							github: {
								tools: [],
								auth: {
									type: "secret",
									secretId: payload.secretId,
								},
							},
						},
					});
					break;
				default: {
					const _exhaustiveCheck: never = payload;
					throw new Error(`Unhandled secretType: ${_exhaustiveCheck}`);
				}
			}
			setPresentDialog(false);
		},
		[node, updateNodeDataContent, client, workspace.id, data, mutate],
	);
	return (
		<ToolList.Dialog
			open={presentDialog}
			onOpenChange={setPresentDialog}
			enable={!!node.content.tools?.github}
			onSubmit={setupGitHubTool}
			submitting={isPending}
		>
			<ToolList.DialogHeader
				title="Conenct to GitHub"
				description="How would you like to add your Personal Access Token (PAT)? "
			/>
			<Tabs value={tabValue} onValueChange={setTabValue}>
				<TabsList className="mb-[12px]">
					<TabsTrigger value="create">Paste New Token</TabsTrigger>
					<TabsTrigger value="select">Use Saved Token</TabsTrigger>
				</TabsList>
				<TabsContent value="create">
					<input
						type="hidden"
						name="secretType"
						value={GitHubToolSetupSecretType.create}
					/>
					<div className="flex flex-col gap-[12px]">
						<fieldset className="flex flex-col">
							<label htmlFor="label" className="text-text text-[13px] mb-[2px]">
								Token Name
							</label>
							<input
								type="text"
								id="label"
								name="label"
								className={clsx(
									"border border-border rounded-[4px] bg-editor-background outline-none px-[8px] py-[2px] text-[14px]",
									"focus:border-border-focused",
								)}
							/>
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
							<input
								type="text"
								id="pat"
								name="value"
								className={clsx(
									"border border-border rounded-[4px] bg-editor-background outline-none px-[8px] py-[2px] text-[14px]",
									"focus:border-border-focused",
								)}
							/>
							<p className="text-[11px] text-text-muted px-[4px] mt-[1px]">
								We’ll encrypt the token with authenticated encryption before
								saving it.
							</p>
						</fieldset>
					</div>
				</TabsContent>
				<TabsContent value="select">
					{isLoading ? (
						<p>Loading...</p>
					) : (
						<>
							{(data ?? []).length < 1 ? (
								<EmptyState description="No saved tokens yet">
									<Button
										onClick={() => setTabValue("create")}
										leftIcon={<PlusIcon />}
									>
										Save First Token
									</Button>
								</EmptyState>
							) : (
								<>
									<p className="text-[11px] text-text-muted my-[4px]">
										Pick one of your encrypted tokens to connect.
									</p>
									<input
										type="hidden"
										name="secretType"
										value={GitHubToolSetupSecretType.select}
									/>
									<fieldset className="flex flex-col">
										<label
											htmlFor="label"
											className="text-text text-[13px] mb-[2px]"
										>
											Select a saved token
										</label>
										<div>
											<Select
												name="secretId"
												placeholder="Choose a token… "
												options={data ?? []}
												renderOption={(option) => option.label}
												widthClassName="w-[180px]"
											/>
										</div>
									</fieldset>
								</>
							)}
						</>
					)}
				</TabsContent>
			</Tabs>
		</ToolList.Dialog>
	);
}

export function ToolsPanel({
	node,
}: {
	node: TextGenerationNode;
}) {
	return (
		<div className="text-white-400 space-y-[16px]">
			<ToolList.Item
				icon={<GitHubIcon data-tool-icon />}
				configurationPanel={<GitHubToolSetting node={node} />}
			>
				<div className="flex gap-[10px] items-center">
					<h3 className="text-text text-[14px]">GitHub</h3>
					{node.content.tools?.github && (
						<CheckIcon className="size-[14px] text-success" />
					)}
				</div>
			</ToolList.Item>
		</div>
	);
}

interface ToolListItemProps {
	icon: ReactNode;
	configurationPanel: ReactNode;
}
interface ToolListDialogProps
	extends Omit<ComponentProps<typeof Dialog>, "children"> {
	enable: boolean;
	onSubmit: React.FormEventHandler<HTMLFormElement>;
	submitting: boolean;
}
interface ToolListDialogHeaderProps {
	title: string;
	description: string;
}
const ToolList = {
	Item({
		children,
		icon,
		configurationPanel,
	}: PropsWithChildren<ToolListItemProps>) {
		return (
			<div
				className={clsx(
					"border border-border rounded-[8px] px-[12px] w-full flex items-center justify-between py-[10px]",
					"**:data-tool-icon:size-[20px] **:data-tool-icon:text-text-muted",
					"**:data-dialog-trigger-icon:size-[14px]",
				)}
			>
				<div className="flex gap-[10px] items-center">
					{icon}
					{children}
				</div>
				{configurationPanel}
			</div>
		);
	},
	Dialog({
		open,
		onOpenChange,
		defaultOpen,
		children,
		enable,
		onSubmit,
		submitting,
	}: PropsWithChildren<ToolListDialogProps>) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange} defaultOpen={defaultOpen}>
				<DialogTrigger asChild>
					<Button
						type="button"
						leftIcon={
							enable ? (
								<Settings2Icon data-dialog-trigger-icon />
							) : (
								<PlusIcon data-dialog-trigger-icon />
							)
						}
					>
						{enable ? "Configure" : "Connect"}
					</Button>
				</DialogTrigger>
				<DialogContent>
					<form onSubmit={onSubmit}>
						{children}
						<DialogFooter>
							<button
								type="submit"
								className="flex items-center gap-[4px] text-[14px] text-text hover:bg-ghost-element-hover transition-colors px-[8px] rounded-[2px] cursor-pointer"
								disabled={submitting}
							>
								{submitting ? "..." : "Save & Connect"}
							</button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		);
	},
	DialogHeader({ title, description }: ToolListDialogHeaderProps) {
		return (
			<div className="py-[12px]">
				<DialogTitle>{title}</DialogTitle>
				<DialogDescription>{description}</DialogDescription>
			</div>
		);
	},
};
