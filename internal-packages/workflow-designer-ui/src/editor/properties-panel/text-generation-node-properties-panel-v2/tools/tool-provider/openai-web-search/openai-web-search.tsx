import { Button } from "@giselle-internal/ui/button";
import { Toggle } from "@giselle-internal/ui/toggle";
import type { ContentGenerationNode } from "@giselles-ai/protocol";
import { useWorkflowDesigner } from "@giselles-ai/react";
import { Settings2Icon, XIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { upsertArray } from "../../../../../lib/upsert-array";
import { ToolConfigurationDialog } from "../../ui/tool-configuration-dialog";

function isValidDomain(domain: string): { isValid: boolean; message?: string } {
	const domainRegex =
		/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;

	if (!domainRegex.test(domain)) {
		return {
			isValid: false,
			message: "Please enter a valid domain (e.g., example.com)",
		};
	}

	return { isValid: true };
}

const toolName = "openai-web-search";

export function OpenAiWebSearchToolConfigurationDialog({
	node,
	open: externalOpen,
	onOpenChange: externalOnOpenChange,
}: {
	node: ContentGenerationNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}) {
	const { updateNodeDataContent } = useWorkflowDesigner();
	const [internalOpen, setInternalOpen] = useState(false);

	const open = externalOpen ?? internalOpen;
	const setOpen = externalOnOpenChange ?? setInternalOpen;

	const currentToolConfig = useMemo(() => {
		const tool = node.content.tools.find(
			(currentTool) => currentTool.name === toolName,
		);
		if (!tool) {
			return undefined;
		}

		const allowedDomains = tool.configuration.allowedDomains ?? [];

		return {
			allowedDomains,
		};
	}, [node.content.tools]);

	const [webSearchEnabled, setWebSearchEnabled] = useState(!!currentToolConfig);
	const [allowedDomains, setAllowedDomains] = useState<string[]>(
		currentToolConfig?.allowedDomains ?? [],
	);

	const [domainInput, setDomainInput] = useState("");
	const [domainErrors, setDomainErrors] = useState<
		{ message: string; domains?: string[] }[]
	>([]);

	const addDomainTags = () => {
		if (!domainInput.trim()) {
			return;
		}

		const domains = domainInput
			.trim()
			.split(/[,;\s]+/)
			.filter((domain) => domain.trim());

		const uniqueDomains = [...new Set(domains)];

		const validTags: string[] = [];
		const invalidDomains: string[] = [];
		const duplicateDomains: string[] = [];

		for (const domain of uniqueDomains) {
			const validation = isValidDomain(domain);

			if (!validation.isValid) {
				invalidDomains.push(domain);
			} else if (allowedDomains.includes(domain)) {
				duplicateDomains.push(domain);
			} else {
				validTags.push(domain);
			}
		}

		const errorList: { message: string; domains?: string[] }[] = [];
		if (invalidDomains.length > 0) {
			errorList.push({
				message: "Invalid domain format",
				domains: invalidDomains,
			});
		}
		if (duplicateDomains.length > 0) {
			errorList.push({
				message: "Already added",
				domains: duplicateDomains,
			});
		}
		if (errorList.length > 0) {
			setDomainErrors(errorList);
		} else {
			setDomainErrors([]);
		}

		if (validTags.length > 0) {
			setAllowedDomains([...allowedDomains, ...validTags]);
		}

		if (invalidDomains.length > 0 || duplicateDomains.length > 0) {
			setDomainInput([...invalidDomains, ...duplicateDomains].join(", "));
		} else {
			setDomainInput("");
		}
	};

	const removeDomainTag = (domainToRemove: string) => {
		setAllowedDomains(
			allowedDomains.filter((domain) => domain !== domainToRemove),
		);
	};

	const handleDomainKeyDown = (
		event: React.KeyboardEvent<HTMLInputElement>,
	) => {
		if (event.key === "Enter") {
			event.preventDefault();
			addDomainTags();
		}
	};

	const handleWebSearchToggle = useCallback((enabled: boolean) => {
		setWebSearchEnabled(enabled);
	}, []);

	const updateOpenAiWebSearchToolConfiguration = useCallback<
		React.FormEventHandler<HTMLFormElement>
	>(
		(event) => {
			event.preventDefault();

			const nextConfiguration =
				allowedDomains.length > 0
					? {
							allowedDomains,
						}
					: {};

			type ToolTransition = "noop" | "upsert" | "remove";
			const transition: ToolTransition = webSearchEnabled
				? "upsert"
				: currentToolConfig
					? "remove"
					: "noop";

			if (transition === "noop") {
				setOpen(false);
				return;
			}

			switch (transition) {
				case "remove": {
					updateNodeDataContent(node, {
						...node.content,
						tools: node.content.tools.filter((tool) => tool.name !== toolName),
					});
					break;
				}
				case "upsert": {
					updateNodeDataContent(node, {
						...node.content,
						tools: upsertArray(
							node.content.tools,
							{
								name: toolName,
								configuration: nextConfiguration,
							},
							(tool) => tool.name === toolName,
						),
					});
					break;
				}
			}

			setOpen(false);
		},
		[
			node,
			updateNodeDataContent,
			allowedDomains,
			currentToolConfig,
			webSearchEnabled,
			setOpen,
		],
	);

	return (
		<ToolConfigurationDialog
			title="Web Search Configuration"
			description=""
			onSubmit={updateOpenAiWebSearchToolConfiguration}
			submitting={false}
			trigger={
				<Button
					type="button"
					leftIcon={<Settings2Icon data-dialog-trigger-icon />}
					variant="link"
				>
					Configure
				</Button>
			}
			open={open}
			onOpenChange={setOpen}
		>
			<div className="flex flex-col gap-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="text-[14px] py-[1.5px] whitespace-nowrap">
							Web Search
						</div>
						<div className="text-[12px] text-text-muted whitespace-nowrap">
							Enable for this model
						</div>
					</div>
					<div className="flex-1 h-px bg-border ml-4"></div>
					<Toggle
						name="web-search-enabled"
						checked={webSearchEnabled}
						onCheckedChange={handleWebSearchToggle}
					/>
				</div>

				{webSearchEnabled && (
					<div className="flex flex-col gap-4">
						<div className="flex items-center gap-4">
							<h3 className="text-sm font-medium text-text">Allowed Domains</h3>
							<p className="text-xs text-text-muted">
								Optional: list domains to restrict search scope. Leave empty to
								allow all.
							</p>
						</div>

						<div className="flex flex-col gap-4">
							<div className="flex items-start gap-3 rounded-lg bg-bg/80 p-1">
								<div className="flex min-h-[40px] flex-grow flex-wrap items-center gap-1">
									{allowedDomains.map((domain) => (
										<div
											key={domain}
											className="mb-1 mr-2 flex items-center rounded-[4px] p-[1px] w-fit"
										>
											<div className="px-[8px] py-[2px] rounded-[3px] text-[12px] flex items-center gap-[4px] border bg-[rgba(var(--color-success-rgb),0.05)] text-success border-[rgba(var(--color-success-rgb),0.1)]">
												<span className="max-w-[180px] truncate">{domain}</span>
												<button
													type="button"
													onClick={() => removeDomainTag(domain)}
													className="ml-1 hover:opacity-70 *:size-[12px]"
												>
													<XIcon />
												</button>
											</div>
										</div>
									))}
									<input
										type="text"
										placeholder={
											allowedDomains.length > 0
												? "Add more domains..."
												: "Domain Names (separate with commas)"
										}
										value={domainInput}
										onChange={(event) => {
											setDomainErrors([]);
											setDomainInput(event.target.value);
										}}
										onKeyDown={handleDomainKeyDown}
										onBlur={() => addDomainTags()}
										className="min-w-[200px] flex-1 border-none bg-transparent px-1 py-1 text-[14px] text-inverse outline-none placeholder:text-[color-mix(in_srgb,var(--color-text-inverse,#fff)_30%,transparent)]"
									/>
								</div>
							</div>

							{domainErrors.length > 0 && (
								<div className="mt-1 space-y-1">
									{domainErrors.map((error) => (
										<div
											key={`${error.message}-${error.domains?.join(",") || ""}`}
											className="text-sm text-error-500"
										>
											{error.domains && error.domains.length > 0 ? (
												<>
													<span className="font-medium">{error.message}:</span>{" "}
													<span>{error.domains.join(", ")}</span>
												</>
											) : (
												<span>{error.message}</span>
											)}
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</ToolConfigurationDialog>
	);
}
