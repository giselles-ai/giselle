import { Input } from "@giselle-internal/ui/input";
import { Select } from "@giselle-internal/ui/select";
import type {
	LanguageModelTool,
	LanguageModelToolConfigurationOption,
} from "@giselles-ai/language-model-registry";
import { titleCase } from "@giselles-ai/utils";
import clsx from "clsx/lite";
import { Switch } from "radix-ui";
import { useCallback, useEffect, useState } from "react";
import { useWorkspaceSecrets } from "../../../lib/use-workspace-secrets";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "../../text-generation-node-properties-panel/tools/ui/tabs";
import { ConfigurationFormFieldLabel } from "../configuration-form-field-label";
import { TagInputField } from "./tag-input-field";
import {
	isSecretConfigurationValue,
	parseSecretConfigurationValue,
	type SecretConfigurationValue,
} from "./tool-configuration-utils";

function EnumField({
	name,
	label,
	option,
	value,
	onValueChange,
}: {
	name: string;
	label: string;
	option: Extract<LanguageModelToolConfigurationOption, { type: "enum" }>;
	value: unknown;
	onValueChange: (value: unknown) => void;
}) {
	const options = option.options.map((opt) => ({
		value: String(opt.value),
		label: opt.label ?? String(opt.value),
	}));
	return (
		<div className="flex justify-between">
			<ConfigurationFormFieldLabel
				label={label}
				tooltip={option.description}
				optional={option.optional}
			/>
			<div>
				<Select
					widthClassName="w-fit"
					options={options}
					placeholder={`Select ${name}...`}
					value={String(value ?? "")}
					onValueChange={onValueChange}
				/>
			</div>
		</div>
	);
}

function BooleanField({
	label,
	option,
	value,
	onValueChange,
}: {
	label: string;
	option: Extract<LanguageModelToolConfigurationOption, { type: "boolean" }>;
	value: unknown;
	onValueChange: (value: unknown) => void;
}) {
	return (
		<div className="flex justify-between">
			<ConfigurationFormFieldLabel label={label} tooltip={option.description} />
			<Switch.Root
				className={clsx(
					"h-[15px] w-[27px] rounded-full outline-none transition-colors",
					"border border-border-muted data-[state=checked]:border-primary-900",
					"bg-transparent data-[state=checked]:bg-primary-900",
					"disabled:opacity-50 disabled:cursor-not-allowed",
				)}
				checked={Boolean(value)}
				onCheckedChange={onValueChange}
			>
				<Switch.Thumb
					className={clsx(
						"block size-[11px] translate-x-[2px] rounded-full",
						"bg-text-inverse",
						"transition-transform duration-100 will-change-transform data-[state=checked]:translate-x-[13px]",
					)}
				/>
			</Switch.Root>
		</div>
	);
}

function NumberField({
	name,
	label,
	option,
	value,
	onValueChange,
}: {
	name: string;
	label: string;
	option: Extract<LanguageModelToolConfigurationOption, { type: "number" }>;
	value: unknown;
	onValueChange: (value: unknown) => void;
}) {
	const numValue = Number(value ?? option.defaultValue ?? 0);
	return (
		<div className="flex flex-col gap-[4px]">
			<ConfigurationFormFieldLabel label={label} tooltip={option.description} />
			<Input
				name={name}
				type="number"
				min={option.min}
				max={option.max}
				step={option.step ?? 1}
				value={numValue}
				onChange={(e) => {
					onValueChange(Number(e.target.value));
				}}
			/>
		</div>
	);
}

function ToolSelectionField({
	label,
	option,
	value,
	tools,
	onValueChange,
}: {
	label: string;
	option: Extract<
		LanguageModelToolConfigurationOption,
		{ type: "toolSelection" }
	>;
	value: unknown;
	tools: NonNullable<LanguageModelTool["tools"]>;
	onValueChange: (value: unknown) => void;
}) {
	const selectedTools = Array.isArray(value) ? (value as string[]) : [];
	return (
		<div className="flex flex-col gap-[8px]">
			<ConfigurationFormFieldLabel label={label} tooltip={option.description} />
			<div className="flex flex-col gap-[8px]">
				{tools.map((toolOption) => {
					const isSelected = selectedTools.includes(toolOption.name);
					return (
						<label
							key={toolOption.name}
							className="flex items-center gap-[8px] cursor-pointer"
						>
							<input
								type="checkbox"
								checked={isSelected}
								onChange={(e) => {
									const newSelectedTools = e.target.checked
										? [...selectedTools, toolOption.name]
										: selectedTools.filter((t) => t !== toolOption.name);
									onValueChange(newSelectedTools);
								}}
								className="size-[16px] rounded border-border"
							/>
							<span className="text-[14px] text-text">
								{toolOption.title ?? toolOption.name}
							</span>
							{toolOption.description && (
								<span className="text-[12px] text-text-muted">
									- {toolOption.description}
								</span>
							)}
						</label>
					);
				})}
			</div>
		</div>
	);
}

function TagArrayField({
	label,
	option,
	value,
	onValueChange,
}: {
	label: string;
	option: Extract<LanguageModelToolConfigurationOption, { type: "tagArray" }>;
	value: unknown;
	onValueChange: (value: unknown) => void;
}) {
	const arrayValue = Array.isArray(value) ? (value as string[]) : [];
	return (
		<TagInputField
			label={label}
			value={arrayValue}
			onValueChange={(newValue) => onValueChange(newValue)}
			placeholder={option.placeholder}
			description={option.description}
			validate={option.validate}
			optional={option.optional}
		/>
	);
}

function ObjectField({
	name,
	label,
	option,
	value,
	onValueChange,
}: {
	name: string;
	label: string;
	option: Extract<LanguageModelToolConfigurationOption, { type: "object" }>;
	value: unknown;
	onValueChange: (value: unknown) => void;
}) {
	// For objects, show as JSON input
	const objectValue =
		typeof value === "object" && value !== null
			? JSON.stringify(value, null, 2)
			: "";
	const [jsonText, setJsonText] = useState(objectValue);

	useEffect(() => {
		try {
			const currentParsed = JSON.parse(jsonText || "{}");
			// If currentValue matches what we have in text, don't update text (preserve formatting)
			if (JSON.stringify(value ?? {}) !== JSON.stringify(currentParsed)) {
				setJsonText(
					typeof value === "object" && value !== null
						? JSON.stringify(value, null, 2)
						: "",
				);
			}
		} catch {
			// Invalid JSON or mismatch, handle appropriately
		}
	}, [value, jsonText]);

	return (
		<div className="flex flex-col gap-[4px]">
			<ConfigurationFormFieldLabel label={label} tooltip={option.description} />
			<textarea
				name={`${name}_display`}
				className="min-h-[100px] w-full rounded-md border border-border bg-bg px-3 py-2 text-[14px] text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
				value={jsonText}
				onChange={(e) => {
					const newValue = e.target.value;
					setJsonText(newValue);
					try {
						const parsed = JSON.parse(newValue);
						onValueChange(parsed);
					} catch {
						// Invalid JSON, don't update parent yet
					}
				}}
				placeholder="JSON object"
			/>
		</div>
	);
}

function TextField({
	name,
	label,
	option,
	value,
	onValueChange,
}: {
	name: string;
	label: string;
	option: Extract<LanguageModelToolConfigurationOption, { type: "text" }>;
	value: unknown;
	onValueChange: (value: unknown) => void;
}) {
	return (
		<div className="flex flex-col gap-[4px]">
			<ConfigurationFormFieldLabel
				label={label}
				tooltip={option.description}
				optional={option.optional}
			/>
			<Input
				name={name}
				type="text"
				value={String(value ?? option.defaultValue ?? "")}
				onChange={(e) => {
					onValueChange(e.target.value);
				}}
				placeholder={option.placeholder}
			/>
		</div>
	);
}

function SecretField({
	name,
	option,
	value,
	onValueChange,
}: {
	name: string;
	option: Extract<LanguageModelToolConfigurationOption, { type: "secret" }>;
	value: unknown;
	onValueChange: (value: SecretConfigurationValue | null) => void;
}) {
	const [tabValue, setTabValue] = useState<"create" | "select">("select");
	const { isLoading, data: secrets } = useWorkspaceSecrets(option.secretTags);

	// Parse value into discriminated union
	const parsedValue = parseSecretConfigurationValue(value);
	const selectedSecretId =
		parsedValue?.type === "secretId" ? parsedValue.secretId : undefined;
	const tokenInput =
		parsedValue?.type === "tokenInput" ? parsedValue.tokenInput : undefined;

	const [tokenValue, setTokenValue] = useState(tokenInput?.token ?? "");
	const [tokenLabel, setTokenLabel] = useState(tokenInput?.label ?? "");

	// Sync local state with value prop
	useEffect(() => {
		if (tokenInput) {
			setTokenValue(tokenInput.token);
			setTokenLabel(tokenInput.label ?? "");
		} else if (selectedSecretId) {
			setTokenValue("");
			setTokenLabel("");
		}
	}, [tokenInput, selectedSecretId]);

	const handleValueChange = useCallback(
		(parsed: SecretConfigurationValue | null) => {
			onValueChange(parsed);
		},
		[onValueChange],
	);

	const handleSelectSecret = useCallback(
		(secretId: string) => {
			handleValueChange({ type: "secretId", secretId });
		},
		[handleValueChange],
	);

	const handleTokenChange = useCallback(
		(newToken: string) => {
			setTokenValue(newToken);
			if (newToken) {
				handleValueChange({
					type: "tokenInput",
					tokenInput: {
						token: newToken,
						...(tokenLabel && { label: tokenLabel }),
					},
				});
			} else {
				handleValueChange(null);
			}
		},
		[tokenLabel, handleValueChange],
	);

	const handleTokenLabelChange = useCallback(
		(newLabel: string) => {
			setTokenLabel(newLabel);
			if (tokenValue) {
				handleValueChange({
					type: "tokenInput",
					tokenInput: {
						token: tokenValue,
						...(newLabel && { label: newLabel }),
					},
				});
			}
		},
		[tokenValue, handleValueChange],
	);

	const hasSavedTokens = (secrets ?? []).length > 0;

	return (
		<div className="flex flex-col gap-[12px]">
			{isLoading ? (
				<p className="text-[14px] text-text-muted">Loading...</p>
			) : !hasSavedTokens ? (
				<div className="flex flex-col gap-[12px]">
					<fieldset className="flex flex-col gap-[4px]">
						<label htmlFor={`${name}_value`} className="text-text text-[13px]">
							{option.title ?? titleCase(name)}
						</label>
						<Input
							type="password"
							autoComplete="off"
							data-1p-ignore
							data-lpignore="true"
							id={`${name}_value`}
							value={tokenValue}
							onChange={(e) => handleTokenChange(e.target.value)}
							placeholder="Enter token value"
							required
						/>
						{option.description && (
							<p className="text-[11px] text-text-muted px-[4px]">
								{option.description}
							</p>
						)}
					</fieldset>
					<fieldset className="flex flex-col gap-[4px]">
						<label htmlFor={`${name}_label`} className="text-text text-[13px]">
							Token Name <span className="text-text-muted">(Optional)</span>
						</label>
						<Input
							type="text"
							id={`${name}_label`}
							value={tokenLabel}
							onChange={(e) => handleTokenLabelChange(e.target.value)}
							placeholder="Give this token a short name"
						/>
						{tokenLabel ? (
							<p className="text-[11px] text-text-muted px-[4px]">
								This token will be saved and can be reused in other nodes.
							</p>
						) : (
							<p className="text-[11px] text-text-muted px-[4px]">
								Leave blank to use this token only for this node. Add a name to
								save it for reuse in other nodes.
							</p>
						)}
					</fieldset>
				</div>
			) : (
				<Tabs
					value={tabValue}
					onValueChange={(v) => setTabValue(v as "create" | "select")}
				>
					<TabsList className="mb-[12px]">
						<TabsTrigger value="select">Use Saved Token</TabsTrigger>
						<TabsTrigger value="create">Paste New Token</TabsTrigger>
					</TabsList>
					<TabsContent value="select">
						<div className="flex flex-col gap-[8px]">
							<p className="text-[11px] text-text-muted">
								Pick one of your encrypted tokens to use.
							</p>
							<Select
								options={secrets?.map((s) => ({ ...s, value: s.id })) ?? []}
								placeholder="Choose a token…"
								value={selectedSecretId ?? ""}
								onValueChange={handleSelectSecret}
								renderOption={(option) => option.label}
								widthClassName="w-full"
							/>
						</div>
					</TabsContent>
					<TabsContent value="create">
						<div className="flex flex-col gap-[12px]">
							<fieldset className="flex flex-col gap-[4px]">
								<label
									htmlFor={`${name}_label`}
									className="text-text text-[13px]"
								>
									Token Name <span className="text-text-muted">(Optional)</span>
								</label>
								<Input
									type="text"
									id={`${name}_label`}
									value={tokenLabel}
									onChange={(e) => handleTokenLabelChange(e.target.value)}
									placeholder="Give this token a short name"
								/>
								{tokenLabel ? (
									<p className="text-[11px] text-text-muted px-[4px]">
										This token will be saved and can be reused in other nodes.
									</p>
								) : (
									<p className="text-[11px] text-text-muted px-[4px]">
										Leave blank to use this token only for this configuration.
										Add a name to save it for reuse in other nodes.
									</p>
								)}
							</fieldset>
							<fieldset className="flex flex-col gap-[4px]">
								<label
									htmlFor={`${name}_value`}
									className="text-text text-[13px]"
								>
									Token Value
								</label>
								<Input
									type="password"
									autoComplete="off"
									data-1p-ignore
									data-lpignore="true"
									id={`${name}_value`}
									value={tokenValue}
									onChange={(e) => handleTokenChange(e.target.value)}
									placeholder="Enter token value"
									required
								/>
								{option.description && (
									<p className="text-[11px] text-text-muted px-[4px]">
										{option.description}
									</p>
								)}
								<p className="text-[11px] text-text-muted px-[4px]">
									We'll encrypt the token with authenticated encryption before
									saving it.
								</p>
							</fieldset>
						</div>
					</TabsContent>
				</Tabs>
			)}
		</div>
	);
}

function ToolConfigurationField({
	name,
	option,
	value,
	defaultValue,
	tool,
	onValueChange,
}: {
	name: string;
	option: LanguageModelToolConfigurationOption;
	value: unknown;
	defaultValue?: unknown;
	tool?: LanguageModelTool;
	onValueChange: (value: unknown) => void;
}) {
	const label = option.title ?? titleCase(name);
	const currentValue = value ?? defaultValue ?? option.defaultValue;

	switch (option.type) {
		case "enum":
			return (
				<EnumField
					name={name}
					label={label}
					option={option}
					value={currentValue}
					onValueChange={onValueChange}
				/>
			);
		case "boolean":
			return (
				<BooleanField
					label={label}
					option={option}
					value={currentValue}
					onValueChange={onValueChange}
				/>
			);
		case "number":
			return (
				<NumberField
					name={name}
					label={label}
					option={option}
					value={currentValue}
					onValueChange={onValueChange}
				/>
			);
		case "toolSelection":
			if (!tool?.tools) {
				return null;
			}
			return (
				<ToolSelectionField
					label={label}
					option={option}
					value={currentValue}
					tools={tool.tools}
					onValueChange={onValueChange}
				/>
			);
		case "tagArray":
			return (
				<TagArrayField
					label={label}
					option={option}
					value={currentValue}
					onValueChange={onValueChange}
				/>
			);
		case "object":
			return (
				<ObjectField
					name={name}
					label={label}
					option={option}
					value={currentValue}
					onValueChange={onValueChange}
				/>
			);
		case "text":
			return (
				<TextField
					name={name}
					label={label}
					option={option}
					value={currentValue}
					onValueChange={onValueChange}
				/>
			);
		case "secret":
			return (
				<SecretField
					name={name}
					option={option}
					value={currentValue}
					onValueChange={(secretValue) => {
						if (secretValue === null) {
							onValueChange(undefined);
						} else {
							onValueChange(secretValue);
						}
					}}
				/>
			);
		default: {
			const _exhaustiveCheck: never = option;
			throw new Error(`Unhandled option type: ${_exhaustiveCheck}`);
		}
	}
}

function validateConfigurationValue(
	option: LanguageModelToolConfigurationOption,
	value: unknown,
): { isValid: boolean; message?: string } {
	// If optional and value is undefined/null/empty, it's valid
	if (
		option.optional &&
		(value === undefined || value === null || value === "")
	) {
		return { isValid: true };
	}

	switch (option.type) {
		case "text": {
			if (typeof value !== "string") {
				return { isValid: false, message: "Must be a string" };
			}
			return { isValid: true };
		}
		case "number": {
			if (typeof value !== "number" || Number.isNaN(value)) {
				return { isValid: false, message: "Must be a number" };
			}
			if (option.min !== undefined && value < option.min) {
				return {
					isValid: false,
					message: `Must be at least ${option.min}`,
				};
			}
			if (option.max !== undefined && value > option.max) {
				return {
					isValid: false,
					message: `Must be at most ${option.max}`,
				};
			}
			return { isValid: true };
		}
		case "boolean": {
			if (typeof value !== "boolean") {
				return { isValid: false, message: "Must be a boolean" };
			}
			return { isValid: true };
		}
		case "enum": {
			const validValues = option.options.map((opt) => String(opt.value));
			if (!validValues.includes(String(value))) {
				return {
					isValid: false,
					message: `Must be one of: ${validValues.join(", ")}`,
				};
			}
			return { isValid: true };
		}
		case "tagArray": {
			if (!Array.isArray(value)) {
				return { isValid: false, message: "Must be an array" };
			}
			if (option.validate) {
				for (const item of value) {
					if (typeof item !== "string") {
						return { isValid: false, message: "All items must be strings" };
					}
					const validation = option.validate(item);
					if (!validation.isValid) {
						return validation;
					}
				}
			}
			return { isValid: true };
		}
		case "toolSelection": {
			if (!Array.isArray(value)) {
				return { isValid: false, message: "Must be an array" };
			}
			return { isValid: true };
		}
		case "object": {
			if (typeof value !== "object" || value === null || Array.isArray(value)) {
				return { isValid: false, message: "Must be an object" };
			}
			return { isValid: true };
		}
		case "secret": {
			// Validate SecretConfigurationValue (discriminated union)
			if (!isSecretConfigurationValue(value)) {
				return {
					isValid: false,
					message: "Must be a secret ID or token object",
				};
			}
			return { isValid: true };
		}
		default: {
			const _exhaustiveCheck: never = option;
			throw new Error(`Unhandled option type: ${_exhaustiveCheck}`);
		}
	}
}

export function validateToolConfiguration(
	tool: LanguageModelTool,
	config: Record<string, unknown>,
): { isValid: boolean; errors: Record<string, string> } {
	const errors: Record<string, string> = {};

	for (const [key, option] of Object.entries(tool.configurationOptions)) {
		const value = config[key];
		const validation = validateConfigurationValue(option, value);

		if (!validation.isValid) {
			errors[key] = validation.message ?? "Invalid value";
		}
	}

	return {
		isValid: Object.keys(errors).length === 0,
		errors,
	};
}

export function ToolConfigurationForm({
	tool,
	currentConfig,
	onConfigChange,
}: {
	tool: LanguageModelTool;
	currentConfig?: Record<string, unknown>;
	onConfigChange: (config: Record<string, unknown>) => void;
}) {
	return (
		<div className="flex flex-col gap-[20px]">
			{Object.entries(tool.configurationOptions).map(([key, option]) => {
				const value = currentConfig?.[key];
				return (
					<ToolConfigurationField
						key={key}
						name={key}
						option={option}
						value={value}
						tool={tool}
						onValueChange={(newValue) => {
							onConfigChange({ ...currentConfig, [key]: newValue });
						}}
					/>
				);
			})}
		</div>
	);
}
