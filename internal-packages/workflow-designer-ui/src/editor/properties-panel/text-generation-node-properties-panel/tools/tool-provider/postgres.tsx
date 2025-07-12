import { Button } from "@giselle-internal/ui/button";
import { EmptyState } from "@giselle-internal/ui/empty-state";
import { Input } from "@giselle-internal/ui/input";
import { Select } from "@giselle-internal/ui/select";
import type { TextGenerationNode } from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "@giselle-sdk/giselle-engine/react";
import { CheckIcon, PlusIcon, Settings2Icon, TrashIcon } from "lucide-react";
import { Checkbox } from "radix-ui";
import { useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
	ToolConfigurationDialog,
	type ToolConfigurationDialogProps,
} from "../ui/tool-configuration-dialog";
import {
	ToolProviderSecretTypeValue,
	useToolProviderConnection,
} from "./use-tool-provider-connection";

const secretTags = ["postgres-connection-string"];

export function PostgresToolConfigurationDialog({
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
		toolKey: "postgres",
		node,
		buildToolConfig: (secretId) => ({ tools: [], secretId }),
	});

	if (!isConfigured) {
		return (
			<PostgresToolConnectionDialog
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
		<PostgresToolConfigurationDialogInternal
			node={node}
			open={presentDialog}
			onOpenChange={setPresentDialog}
		/>
	);
}

function PostgresToolConnectionDialog({
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
	return (
		<ToolConfigurationDialog
			title="Connect to PostgreSQL"
			description="How would you like to connect to your database?"
			onSubmit={onSubmit}
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
					<TabsTrigger value="create">Paste Connection String</TabsTrigger>
					<TabsTrigger value="select">Use Saved Connection String</TabsTrigger>
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
								Connection Name
							</label>
							<Input type="text" id="label" name="label" />
							<p className="text-[11px] text-text-muted px-[4px] mt-[1px]">
								Give this connection a short name (e.g. “Prod-DB”). You’ll use
								it when linking other nodes.
							</p>
						</fieldset>
						<fieldset className="flex flex-col">
							<div className="flex justify-between mb-[2px]">
								<label htmlFor="pat" className="text-text text-[13px]">
									Connection String
								</label>
							</div>
							<Input
								type="password"
								autoComplete="off"
								data-1p-ignore
								data-lpignore="true"
								id="pat"
								name="value"
							/>
							<p className="text-[11px] text-text-muted px-[4px] mt-[1px]">
								We’ll encrypt the connection string with authenticated
								encryption before saving it.
							</p>
						</fieldset>
					</div>
				</TabsContent>
				<TabsContent value="select">
					{isLoading ? (
						<p>Loading...</p>
					) : (secrets ?? []).length < 1 ? (
						<EmptyState description="No saved connection strings.">
							<Button
								onClick={() => setTabValue("create")}
								leftIcon={<PlusIcon />}
							>
								Add a Connection
							</Button>
						</EmptyState>
					) : (
						<>
							<p className="text-[11px] text-text-muted my-[4px]">
								Pick one of your encrypted connection strings.
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
									Select a Saved Connection String
								</label>
								<div>
									<Select
										name="secretId"
										placeholder="Choose a connection string… "
										options={secrets ?? []}
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

const postgresToolCatalog = [
	{
		label: "Schema",
		tools: ["getTableStructure"],
	},
	{
		label: "Query",
		tools: ["query"],
	},
];

function PostgresToolConfigurationDialogInternal({
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
			if (node.content.tools?.postgres === undefined) {
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
					postgres: {
						...node.content.tools.postgres,
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
			title="PostgreSQL Configuration"
			description="Select the PostgreSQL tools you want to enable."
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
						Connection configured.
					</div>
					<Button
						type="button"
						onClick={() => {
							updateNodeDataContent(node, {
								...node.content,
								tools: {
									...node.content.tools,
									postgres: undefined,
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
					{postgresToolCatalog.map((category) => (
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
											defaultChecked={node.content.tools?.postgres?.tools.includes(
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
