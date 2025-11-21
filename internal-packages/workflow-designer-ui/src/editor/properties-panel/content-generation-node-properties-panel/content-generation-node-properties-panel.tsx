import { Input } from "@giselle-internal/ui/input";
import { Popover } from "@giselle-internal/ui/popover";
import { Select } from "@giselle-internal/ui/select";
import { SettingDetail } from "@giselle-internal/ui/setting-label";
import { Toggle } from "@giselle-internal/ui/toggle";
import { getEntry } from "@giselles-ai/language-model-registry";
import type { ContentGenerationNode } from "@giselles-ai/protocol";
import { useWorkflowDesigner } from "@giselles-ai/react";
import { Settings2Icon } from "lucide-react";
import type * as z from "zod/v4";
import {
	NodePanelHeader,
	PropertiesPanelContent,
	PropertiesPanelRoot,
} from "../ui";
import { ModelPickerV2 } from "./model-picker-v2";

function getZodType(
	schema: z.ZodTypeAny,
): "enum" | "number" | "boolean" | "string" {
	const def = schema._def;
	if (def.typeName === "ZodEnum") {
		return "enum";
	}
	if (def.typeName === "ZodNumber") {
		return "number";
	}
	if (def.typeName === "ZodBoolean") {
		return "boolean";
	}
	if (def.typeName === "ZodString") {
		return "string";
	}
	// Default to string for unknown types
	return "string";
}

function getEnumValues(schema: z.ZodTypeAny): string[] {
	const def = schema._def;
	if (def.typeName === "ZodEnum") {
		return def.values;
	}
	return [];
}

function ConfigurationFormField({
	key: configKey,
	option,
	value,
	onChange,
}: {
	key: string;
	option: { description: string; schema: z.ZodTypeAny };
	value: unknown;
	onChange: (value: unknown) => void;
}) {
	const zodType = getZodType(option.schema);

	if (zodType === "enum") {
		const enumValues = getEnumValues(option.schema);
		const options = enumValues.map((v) => ({ value: v, label: v }));
		return (
			<Select
				options={options}
				placeholder={`Select ${configKey}...`}
				value={String(value ?? "")}
				onValueChange={(v) => onChange(v)}
			/>
		);
	}

	if (zodType === "boolean") {
		return (
			<Toggle
				name={configKey}
				checked={Boolean(value)}
				onCheckedChange={(checked) => onChange(checked)}
			>
				<span className="text-[14px] text-inverse">{option.description}</span>
			</Toggle>
		);
	}

	if (zodType === "number") {
		return (
			<Input
				type="number"
				value={String(value ?? "")}
				onChange={(e) => {
					const numValue = parseFloat(e.target.value);
					if (!Number.isNaN(numValue)) {
						onChange(numValue);
					}
				}}
			/>
		);
	}

	// Default to string input
	return (
		<Input
			type="text"
			value={String(value ?? "")}
			onChange={(e) => onChange(e.target.value)}
		/>
	);
}

export function ContentGenerationNodePropertiesPanel({
	node,
}: {
	node: ContentGenerationNode;
}) {
	const { updateNodeData, deleteNode } = useWorkflowDesigner();
	const languageModel = getEntry(node.content.languageModel.id);
	return (
		<PropertiesPanelRoot>
			<NodePanelHeader
				node={node}
				onChangeName={(name) => updateNodeData(node, { name })}
				docsUrl="https://docs.giselles.ai/en/glossary/text-node"
				onDelete={() => deleteNode(node.id)}
			/>

			<PropertiesPanelContent>
				<div className="grid grid-cols-[100px_1fr] gap-y-[12px] gap-x-[12px] items-start">
					<SettingDetail size="md">Model</SettingDetail>
					<div>
						<div className="flex items-center gap-[4px]">
							<ModelPickerV2 value={node.content.languageModel.id} />
							<Popover
								trigger={
									<button
										type="button"
										className="w-[30px] h-[20px] hover:bg-element-hover cursor-pointer flex items-center justify-center rounded-[4px]"
									>
										<Settings2Icon className="size-[14px] shrink-0" />
									</button>
								}
								sideOffset={12}
								align="end"
							>
								<div className="flex flex-col gap-[12px] min-w-[280px] p-[12px]">
									{Object.entries(languageModel.configurationOptions).map(
										([key, option]) => {
											const currentValue =
												node.content.languageModel.configuration[key] ??
												languageModel.defaultConfiguration[key];
											return (
												<div key={key} className="flex flex-col gap-[4px]">
													<SettingDetail size="sm">{key}</SettingDetail>
													<ConfigurationFormField
														key={key}
														option={option}
														value={currentValue}
														onChange={(value) => {
															updateNodeData(node, {
																content: {
																	...node.content,
																	languageModel: {
																		...node.content.languageModel,
																		configuration: {
																			...node.content.languageModel
																				.configuration,
																			[key]: value,
																		},
																	},
																},
															});
														}}
													/>
													{option.description && (
														<p className="text-[11px] text-text-muted">
															{option.description}
														</p>
													)}
												</div>
											);
										},
									)}
								</div>
							</Popover>
						</div>
						{Object.keys(node.content.languageModel.configuration).length >
							0 && (
							<div className="text-[12px] text-inverse flex items-center gap-2 mt-[2px]">
								{Object.entries(node.content.languageModel.configuration).map(
									([key, value]) => (
										<span key={key} className="text-text-secondary flex gap-1">
											<span>{key}:</span>
											<span className="text-info-500">{String(value)}</span>
										</span>
									),
								)}
							</div>
						)}
					</div>
				</div>
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
