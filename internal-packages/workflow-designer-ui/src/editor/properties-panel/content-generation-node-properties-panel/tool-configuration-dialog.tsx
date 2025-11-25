import { Button } from "@giselle-internal/ui/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogFooter,
	type DialogSize,
	DialogTitle,
	DialogTrigger,
} from "@giselle-internal/ui/dialog";
import type { LanguageModelTool } from "@giselles-ai/language-model-registry";
import {
	type ComponentProps,
	type PropsWithChildren,
	useEffect,
	useState,
} from "react";
import {
	ToolConfigurationForm,
	validateToolConfiguration,
} from "./tool-configuration-form";

export interface ToolConfigurationDialogProps
	extends Omit<ComponentProps<typeof Dialog>, "children"> {
	tool: LanguageModelTool;
	currentConfig?: Record<string, unknown>;
	onSubmit: (config: Record<string, unknown>) => void;
	trigger: React.ReactNode | null;
	disabled?: boolean;
	size?: DialogSize;
	submitText?: string;
}

export function ToolConfigurationDialog({
	open,
	onOpenChange,
	defaultOpen,
	children,
	onSubmit,
	tool,
	currentConfig,
	trigger,
	disabled,
	size,
	submitText = "Save",
}: PropsWithChildren<ToolConfigurationDialogProps>) {
	const [config, setConfig] = useState<Record<string, unknown>>(
		currentConfig ?? {},
	);

	useEffect(() => {
		setConfig(currentConfig ?? {});
	}, [currentConfig]);

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		// Apply default values for optional fields that are not set
		const processedConfig: Record<string, unknown> = { ...config };
		for (const [key, option] of Object.entries(tool.configurationOptions)) {
			if (
				processedConfig[key] === undefined &&
				option.defaultValue !== undefined
			) {
				processedConfig[key] = option.defaultValue;
			}
		}

		// Validate configuration
		const validation = validateToolConfiguration(tool, processedConfig);
		if (!validation.isValid) {
			// TODO: Show validation errors to user
			console.error("Validation errors:", validation.errors);
			return;
		}

		// Transform configuration to match content-generation.ts schema
		const transformedConfig: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(processedConfig)) {
			const option = tool.configurationOptions[key];
			if (value === undefined || value === null) {
				// Skip undefined/null values for optional fields
				if (!option.optional) {
					// Required field is missing, but validation should have caught this
					continue;
				}
				continue;
			}

			// Transform enum values to strings
			if (option.type === "enum") {
				transformedConfig[key] = String(value);
			}
			// Transform number values
			else if (option.type === "number") {
				transformedConfig[key] = Number(value);
			}
			// Transform boolean values
			else if (option.type === "boolean") {
				transformedConfig[key] = Boolean(value);
			}
			// Keep other types as-is
			else {
				transformedConfig[key] = value;
			}
		}

		onSubmit(transformedConfig);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange} defaultOpen={defaultOpen}>
			{trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
			<DialogContent
				size={size}
				variant="glass"
				onOpenAutoFocus={(e) => e.preventDefault()}
			>
				<div className="mb-4 shrink-0">
					<DialogTitle className="text-[20px] font-medium text-text tracking-tight font-sans">
						{tool.title ?? tool.name}
					</DialogTitle>
					<DialogDescription className="text-[14px] text-text-muted font-geist mt-2">
						Configure {tool.title ?? tool.name} settings
					</DialogDescription>
				</div>
				<DialogBody className="max-h-[60vh]">
					<form
						id="tool-config-form"
						onSubmit={handleSubmit}
						className="overflow-x-hidden pr-[2px]"
					>
						<ToolConfigurationForm
							tool={tool}
							currentConfig={config}
							onConfigChange={setConfig}
						/>
						{children}
					</form>
				</DialogBody>
				<DialogFooter>
					{submitText && (
						<Button
							type="submit"
							form="tool-config-form"
							variant="solid"
							disabled={disabled}
							size="large"
						>
							{submitText}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
