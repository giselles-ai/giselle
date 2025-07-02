import { Button } from "@giselle-internal/ui/button";
import { EmptyState } from "@giselle-internal/ui/empty-state";
import { Select } from "@giselle-internal/ui/select";
import {
	SecretId,
	type TextGenerationNode,
	type ToolSet,
} from "@giselle-sdk/data-type";
import {
	useGiselleEngine,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle-engine/react";
import clsx from "clsx/lite";
import {
	CheckIcon,
	MoveUpRightIcon,
	PlusIcon,
	Settings2Icon,
	TrashIcon,
} from "lucide-react";
import { Checkbox } from "radix-ui";
import { useCallback, useMemo, useState, useTransition } from "react";
import z from "zod/v4";
import { useWorkspaceSecrets } from "../../../../lib/use-workspace-secrets";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
	ToolConfigurationDialog,
	type ToolConfigurationDialogProps,
} from "../ui/tool-configuration-dialog";

export const ToolSetupSecretType = {
	create: "create",
	select: "select",
} as const;

const ToolSetupPayload = z.discriminatedUnion("secretType", [
	z.object({
		secretType: z.literal(ToolSetupSecretType.create),
		label: z.string().min(1),
		value: z.string().min(1),
	}),
	z.object({
		secretType: z.literal(ToolSetupSecretType.select),
		secretId: SecretId.schema,
	}),
]);

type ProviderKey = keyof ToolSet;

interface LinkConfig {
	href: string;
	text: string;
}

interface ProviderStrings {
	connectionTitle: string;
	connectionDescription: string;
	labelLabel: string;
	labelHelp: string;
	valueLabel: string;
	valueHelp: string;
	valueLink?: LinkConfig;
	createTab: string;
	selectTab: string;
	selectEmptyDescription: string;
	selectEmptyAction: string;
	selectInstruction: string;
	selectLabel: string;
	selectPlaceholder: string;
	configurationTitle: string;
	configurationDescription: string;
	configuredMessage: string;
	resetLabel: string;
}

export interface ToolProviderConfig<K extends ProviderKey> {
	key: K;
	connectionData(secretId: string): NonNullable<ToolSet[K]>;
	toolCatalog: { label: string; tools: string[] }[];
	strings: ProviderStrings;
}

export function ToolProvider<K extends ProviderKey>({
	node,
	config,
}: {
	node: TextGenerationNode;
	config: ToolProviderConfig<K>;
}) {
	const [presentDialog, setPresentDialog] = useState(false);
	const connected = useMemo(
		() => !node.content.tools?.[config.key],
		[node, config.key],
	);

	if (connected) {
		return (
			<ToolConnectionDialog
				node={node}
				config={config}
				open={presentDialog}
				onOpenChange={setPresentDialog}
			/>
		);
	}

	return (
		<ToolConfigurationDialogInternal
			node={node}
			config={config}
			open={presentDialog}
			onOpenChange={setPresentDialog}
		/>
	);
}

function ToolConnectionDialog<K extends ProviderKey>({
	node,
	config,
	open,
	onOpenChange,
}: Pick<ToolConfigurationDialogProps, "open" | "onOpenChange"> & {
	node: TextGenerationNode;
	config: ToolProviderConfig<K>;
}) {
	const [tabValue, setTabValue] = useState("create");
	const { updateNodeDataContent, data: workspace } = useWorkflowDesigner();
	const { isLoading, data, mutate } = useWorkspaceSecrets();
	const client = useGiselleEngine();
	const [isPending, startTransition] = useTransition();
	const setupTool = useCallback<React.FormEventHandler<HTMLFormElement>>(
		(e) => {
			e.preventDefault();
			const formData = new FormData(e.currentTarget);
			const secretType = formData.get("secretType");
			const label = formData.get("label");
			const value = formData.get("value");
			const secretId = formData.get("secretId");
			const parse = ToolSetupPayload.safeParse({
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
								[config.key]: config.connectionData(result.secret.id),
							},
						});
					});
					break;
				case "select":
					updateNodeDataContent(node, {
						...node.content,
						tools: {
							...node.content.tools,
							[config.key]: config.connectionData(payload.secretId),
						},
					});
					break;
				default: {
					const _exhaustiveCheck: never = payload;
					throw new Error(`Unhandled secretType: ${_exhaustiveCheck}`);
				}
			}
		},
		[node, updateNodeDataContent, client, workspace.id, data, mutate, config],
	);
	return (
		<ToolConfigurationDialog
			title={config.strings.connectionTitle}
			description={config.strings.connectionDescription}
			onSubmit={setupTool}
			submitting={isPending}
			trigger={
				<Button type="button" leftIcon={<PlusIcon data-dialog-trigger-icon />}>
					Connect
				</Button>
			}
			open={open}
			onOpenChange={onOpenChange}
		>
			<Tabs value={tabValue} onValueChange={setTabValue}>
				<TabsList className="mb-[12px]">
					<TabsTrigger value="create">{config.strings.createTab}</TabsTrigger>
					<TabsTrigger value="select">{config.strings.selectTab}</TabsTrigger>
				</TabsList>
				<TabsContent value="create">
					<input
						type="hidden"
						name="secretType"
						value={ToolSetupSecretType.create}
					/>
					<div className="flex flex-col gap-[12px]">
						<fieldset className="flex flex-col">
							<label htmlFor="label" className="text-text text-[13px] mb-[2px]">
								{config.strings.labelLabel}
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
								{config.strings.labelHelp}
							</p>
						</fieldset>
						<fieldset className="flex flex-col">
							<div className="flex justify-between mb-[2px]">
								<label htmlFor="value" className="text-text text-[13px]">
									{config.strings.valueLabel}
								</label>
								{config.strings.valueLink && (
									<a
										href={config.strings.valueLink.href}
										className="flex items-center gap-[4px] text-[13px] text-text-muted hover:bg-ghost-element-hover transition-colors px-[4px] rounded-[2px]"
										target="_blank"
										rel="noreferrer"
										tabIndex={-1}
									>
										<span>{config.strings.valueLink.text}</span>
										<MoveUpRightIcon className="size-[13px]" />
									</a>
								)}
							</div>
							<input
								type="password"
								autoComplete="off"
								data-1p-ignore
								data-lpignore="true"
								id="value"
								name="value"
								className={clsx(
									"border border-border rounded-[4px] bg-editor-background outline-none px-[8px] py-[2px] text-[14px]",
									"focus:border-border-focused",
								)}
							/>
							<p className="text-[11px] text-text-muted px-[4px] mt-[1px]">
								{config.strings.valueHelp}
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
								<EmptyState description={config.strings.selectEmptyDescription}>
									<Button
										onClick={() => setTabValue("create")}
										leftIcon={<PlusIcon />}
									>
										{config.strings.selectEmptyAction}
									</Button>
								</EmptyState>
							) : (
								<>
									<p className="text-[11px] text-text-muted my-[4px]">
										{config.strings.selectInstruction}
									</p>
									<input
										type="hidden"
										name="secretType"
										value={ToolSetupSecretType.select}
									/>
									<fieldset className="flex flex-col">
										<label
											htmlFor="label"
											className="text-text text-[13px] mb-[2px]"
										>
											{config.strings.selectLabel}
										</label>
										<div>
											<Select
												name="secretId"
												placeholder={config.strings.selectPlaceholder}
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
		</ToolConfigurationDialog>
	);
}

function ToolConfigurationDialogInternal<K extends ProviderKey>({
	node,
	config,
	open,
	onOpenChange,
}: Pick<ToolConfigurationDialogProps, "open" | "onOpenChange"> & {
	node: TextGenerationNode;
	config: ToolProviderConfig<K>;
}) {
	const { updateNodeDataContent } = useWorkflowDesigner();

	const updateAvailableTools = useCallback<
		React.FormEventHandler<HTMLFormElement>
	>(
		(e) => {
			e.preventDefault();
			const providerTools = node.content.tools?.[config.key];
			if (!providerTools) {
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
					[config.key]: {
						...providerTools,
						tools,
					},
				},
			});
			onOpenChange?.(false);
		},
		[node, updateNodeDataContent, onOpenChange, config.key],
	);

	return (
		<ToolConfigurationDialog
			title={config.strings.configurationTitle}
			description={config.strings.configurationDescription}
			onSubmit={updateAvailableTools}
			submitting={false}
			trigger={
				<Button
					type="button"
					leftIcon={<Settings2Icon data-dialog-trigger-icon />}
				>
					Configuration
				</Button>
			}
			open={open}
			onOpenChange={onOpenChange}
		>
			<div className="flex flex-col">
				<div className="flex justify-between items-center border border-border rounded-[4px] px-[6px] py-[3px] text-[13px] mb-[16px]">
					<div className="flex gap-[6px] items-center">
						<CheckIcon className="size-[14px] text-green-900" />
						{config.strings.configuredMessage}
					</div>
					<Button
						type="button"
						onClick={() => {
							updateNodeDataContent(node, {
								...node.content,
								tools: {
									...node.content.tools,
									[config.key]: undefined,
								},
							});
						}}
						leftIcon={<TrashIcon className="size-[12px]" />}
						size="compact"
					>
						{config.strings.resetLabel}
					</Button>
				</div>
				<div className="flex flex-col gap-6">
					{config.toolCatalog.map((category) => (
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
											defaultChecked={node.content.tools?.[
												config.key
											]?.tools.includes(tool)}
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
