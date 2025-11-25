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
import { useGiselle, useWorkflowDesigner } from "@giselles-ai/react";
import {
	type ComponentProps,
	type PropsWithChildren,
	useEffect,
	useState,
	useTransition,
} from "react";
import { useWorkspaceSecrets } from "../../lib/use-workspace-secrets";
import {
	ToolConfigurationForm,
	validateToolConfiguration,
} from "./tool-configuration-form";
import {
	applyDefaultValues,
	transformConfigurationValues,
} from "./tool-configuration-transform";
import { isSecretConfigurationValue } from "./tool-configuration-utils";

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
	const client = useGiselle();
	const { data: workspace } = useWorkflowDesigner();
	const [isPending, startTransition] = useTransition();

	// Collect all secret tags from secret-type options
	const secretTags = new Set<string>();
	for (const option of Object.values(tool.configurationOptions)) {
		if (option.type === "secret") {
			for (const tag of option.secretTags) {
				secretTags.add(tag);
			}
		}
	}
	const { data: secrets, mutate } = useWorkspaceSecrets(Array.from(secretTags));

	useEffect(() => {
		setConfig(currentConfig ?? {});
	}, [currentConfig]);

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		// Apply default values for optional fields that are not set
		const processedConfig = applyDefaultValues(tool, config);

		// Validate configuration
		const validation = validateToolConfiguration(tool, processedConfig);
		if (!validation.isValid) {
			// TODO: Show validation errors to user
			console.error("Validation errors:", validation.errors);
			return;
		}

		// Process secret fields: create secrets if needed
		const processSecrets = async () => {
			const finalConfig: Record<string, unknown> = { ...processedConfig };

			for (const [key, value] of Object.entries(processedConfig)) {
				const option = tool.configurationOptions[key];
				if (option.type === "secret") {
					// value is already SecretConfigurationValue at this point
					if (!isSecretConfigurationValue(value)) {
						continue;
					}

					switch (value.type) {
						case "secretId":
							finalConfig[key] = value.secretId;
							break;
						case "tokenInput":
							// Create secret if token is provided
							if (value.tokenInput.token) {
								const result = await client.addSecret({
									workspaceId: workspace.id,
									label: value.tokenInput.label ?? "",
									value: value.tokenInput.token,
									tags: option.secretTags,
								});

								// Update cache immediately with new secret (optimistic)
								mutate([...(secrets ?? []), result.secret], false);

								// Replace token object with secret ID
								finalConfig[key] = result.secret.id;
							}
							break;
					}
				}
			}

			// Transform configuration to match content-generation.ts schema
			const transformedConfig = transformConfigurationValues(tool, finalConfig);

			onSubmit(transformedConfig);
		};

		startTransition(processSecrets);
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
							disabled={disabled || isPending}
							size="large"
						>
							{isPending ? "..." : submitText}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
