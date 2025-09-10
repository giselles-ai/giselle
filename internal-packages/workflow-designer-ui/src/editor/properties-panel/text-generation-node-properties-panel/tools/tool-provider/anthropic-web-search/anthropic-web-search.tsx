import { Button } from "@giselle-internal/ui/button";
import type { TextGenerationNode } from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "@giselle-sdk/giselle/react";
import { Settings2Icon, XIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { Slider } from "../../../../../../ui/slider";
import { Switch } from "../../../../../../ui/switch";

import { ToolConfigurationDialog } from "../../ui/tool-configuration-dialog";

// Configuration
const MAX_USES_LIMIT = 10;

// Domain validation function
function isValidDomain(domain: string): { isValid: boolean; message?: string } {
	// Basic domain validation regex
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

export function AnthropicWebSearchToolConfigurationDialog({
	node,
	open: externalOpen,
	onOpenChange: externalOnOpenChange,
}: {
	node: TextGenerationNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}) {
	const { updateNodeDataContent } = useWorkflowDesigner();
	const [internalOpen, setInternalOpen] = useState(false);

	const open = externalOpen ?? internalOpen;
	const setOpen = externalOnOpenChange ?? setInternalOpen;

	// Get current configuration or set defaults
	const currentConfig = node.content.tools?.anthropicWebSearch;
	const [webSearchEnabled, setWebSearchEnabled] = useState(!!currentConfig);
	const [maxUses, setMaxUses] = useState(currentConfig?.maxUses ?? 3);
	const [filteringMode, setFilteringMode] = useState<
		"none" | "allow" | "block"
	>(
		currentConfig?.allowedDomains && currentConfig.allowedDomains.length > 0
			? "allow"
			: currentConfig?.blockedDomains && currentConfig.blockedDomains.length > 0
				? "block"
				: "none",
	);
	const [allowedDomains, setAllowedDomains] = useState<string[]>(
		currentConfig?.allowedDomains ?? [],
	);
	const [blockedDomains, setBlockedDomains] = useState<string[]>(
		currentConfig?.blockedDomains ?? [],
	);

	const [domainListError, setDomainListError] = useState<string | null>(null);
	const [domainInput, setDomainInput] = useState("");
	const [domainErrors, setDomainErrors] = useState<
		{ message: string; domains?: string[] }[]
	>([]);

	const handleMaxUsesChange = useCallback((value: number) => {
		setMaxUses(value);
	}, []);

	const addDomainTags = () => {
		if (!domainInput.trim()) return;

		// Parse domains
		const domains = domainInput
			.trim()
			.split(/[,;\s]+/)
			.filter((domain) => domain.trim());

		// Remove duplicates within the input batch
		const uniqueDomains = [...new Set(domains)];

		const validTags: string[] = [];
		const invalidDomains: string[] = [];
		const duplicateDomains: string[] = [];

		const currentDomains =
			filteringMode === "allow" ? allowedDomains : blockedDomains;

		for (const domain of uniqueDomains) {
			const validation = isValidDomain(domain);

			if (!validation.isValid) {
				invalidDomains.push(domain);
			} else if (currentDomains.includes(domain)) {
				duplicateDomains.push(domain);
			} else {
				validTags.push(domain);
			}
		}

		// Show errors
		const errorList: { message: string; domains?: string[] }[] = [];
		if (invalidDomains.length > 0) {
			errorList.push({
				message: "Invalid domain format",
				domains: invalidDomains,
			});
		}
		if (duplicateDomains.length > 0) {
			errorList.push({ message: "Already added", domains: duplicateDomains });
		}
		if (errorList.length > 0) {
			setDomainErrors(errorList);
		} else {
			setDomainErrors([]);
		}

		// Add valid tags
		if (validTags.length > 0) {
			if (filteringMode === "allow") {
				setAllowedDomains([...allowedDomains, ...validTags]);
			} else {
				setBlockedDomains([...blockedDomains, ...validTags]);
			}
		}

		// Update input field
		if (invalidDomains.length > 0 || duplicateDomains.length > 0) {
			// Keep problematic domains in input for correction
			setDomainInput([...invalidDomains, ...duplicateDomains].join(", "));
		} else {
			// Clear input when all domains were processed successfully
			setDomainInput("");
		}
	};

	const removeDomainTag = (domainToRemove: string) => {
		if (filteringMode === "allow") {
			setAllowedDomains(
				allowedDomains.filter((domain) => domain !== domainToRemove),
			);
		} else {
			setBlockedDomains(
				blockedDomains.filter((domain) => domain !== domainToRemove),
			);
		}
	};

	const handleDomainKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			addDomainTags();
		}
	};

	const handleWebSearchToggle = useCallback((enabled: boolean) => {
		setWebSearchEnabled(enabled);
	}, []);

	const updateAnthropicWebSearchToolConfiguration = useCallback<
		React.FormEventHandler<HTMLFormElement>
	>(
		(e) => {
			e.preventDefault();

			// Clear unused domain list based on filtering mode
			const finalAllowedDomains =
				filteringMode === "allow" ? allowedDomains : undefined;
			const finalBlockedDomains =
				filteringMode === "block" ? blockedDomains : undefined;

			// Update node configuration
			updateNodeDataContent(node, {
				...node.content,
				tools: {
					...node.content.tools,
					anthropicWebSearch: webSearchEnabled
						? {
								maxUses,
								allowedDomains: finalAllowedDomains,
								blockedDomains: finalBlockedDomains,
							}
						: undefined,
				},
			});

			// Clear errors and close
			setDomainListError(null);
			setOpen(false);
		},
		[
			node,
			updateNodeDataContent,
			maxUses,
			filteringMode,
			allowedDomains,
			blockedDomains,
			webSearchEnabled,
			setOpen,
		],
	);

	return (
		<ToolConfigurationDialog
			title="Web Search Configuration"
			description=""
			onSubmit={updateAnthropicWebSearchToolConfiguration}
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
				{/* Web Search Toggle */}
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
					<Switch
						label=""
						name="web-search-enabled"
						checked={webSearchEnabled}
						onCheckedChange={handleWebSearchToggle}
					/>
				</div>

				{/* Maximum Uses Slider */}
				{webSearchEnabled && (
					<div className="flex flex-col gap-2">
						<div className="flex items-center gap-4">
							<div className="text-[14px] py-[1.5px]">
								Maximum Uses (1-{MAX_USES_LIMIT})
							</div>
							<div className="text-[12px] text-text-muted">
								Max searches (1-10)
							</div>
						</div>
						<Slider
							label=""
							value={maxUses}
							min={1}
							max={MAX_USES_LIMIT}
							step={1}
							onChange={handleMaxUsesChange}
						/>
					</div>
				)}

				{webSearchEnabled && (
					<>
						{/* Domain Filtering Section */}
						<div className="flex flex-col gap-4">
							<div className="flex items-center gap-4">
								<h3 className="text-sm font-medium text-text">
									Domain Filtering
								</h3>
								<p className="text-xs text-text-muted">
									Choose how to filter search domains:
								</p>
							</div>

							<div className="flex flex-col gap-3">
								{/* No Filtering */}
								<label className="flex items-start gap-3 cursor-pointer">
									<input
										type="radio"
										name="filtering-mode"
										value="none"
										checked={filteringMode === "none"}
										onChange={(e) => {
											if (e.target.checked) {
												setFilteringMode("none");
												setAllowedDomains([]);
												setBlockedDomains([]);
												if (domainListError) setDomainListError(null);
											}
										}}
										className="mt-1 w-4 h-4"
									/>
									<div className="flex flex-col gap-1">
										<span className="text-sm font-medium text-text">
											No Filtering
										</span>
										<span className="text-sm text-text-muted">
											Search all domains
										</span>
									</div>
								</label>

								{/* Allow Specific Domains */}
								<label className="flex items-start gap-3 cursor-pointer">
									<input
										type="radio"
										name="filtering-mode"
										value="allow"
										checked={filteringMode === "allow"}
										onChange={(e) => {
											if (e.target.checked) {
												setFilteringMode("allow");
												setBlockedDomains([]);
												if (domainListError) setDomainListError(null);
											}
										}}
										className="mt-1 w-4 h-4"
									/>
									<div className="flex flex-col gap-1">
										<span className="text-sm font-medium text-text">
											Allow Specific Domains
										</span>
										<span className="text-sm text-text-muted">
											Only search within listed domains
										</span>
									</div>
								</label>

								{/* Block Specific Domains */}
								<label className="flex items-start gap-3 cursor-pointer">
									<input
										type="radio"
										name="filtering-mode"
										value="block"
										checked={filteringMode === "block"}
										onChange={(e) => {
											if (e.target.checked) {
												setFilteringMode("block");
												setAllowedDomains([]);
												if (domainListError) setDomainListError(null);
											}
										}}
										className="mt-1 w-4 h-4"
									/>
									<div className="flex flex-col gap-1">
										<span className="text-sm font-medium text-text">
											Block Specific Domains
										</span>
										<span className="text-sm text-text-muted">
											Exclude blocked domains
										</span>
									</div>
								</label>
							</div>

							{/* Domain Input Section */}
							{filteringMode !== "none" && (
								<div className="flex flex-col gap-4 mt-4">
									{/* Header with status text on same line */}
									<div className="flex items-center gap-2">
										<h4
											className={`text-sm font-medium ${
												filteringMode === "allow"
													? "text-success"
													: "text-error"
											}`}
										>
											{filteringMode === "allow"
												? "Allowed Domains"
												: "Blocked Domains"}
										</h4>
										<span
											className={`text-xs italic ${
												filteringMode === "allow"
													? "text-success/70"
													: "text-error/70"
											}`}
										>
											{filteringMode === "allow"
												? "No domains specified - all domains will be blocked"
												: "No domains specified"}
										</span>
									</div>

									{/* Domain Input */}
									<div className="flex items-start gap-3 rounded-lg bg-black/80 p-1">
										<div className="flex min-h-[40px] flex-grow flex-wrap items-center gap-1">
											{(filteringMode === "allow"
												? allowedDomains
												: blockedDomains
											).map((domain) => (
												<div
													key={domain}
													className="mb-1 mr-2 flex items-center rounded-[4px] p-[1px] w-fit"
												>
													<div
														className={`px-[8px] py-[2px] rounded-[3px] text-[12px] flex items-center gap-[4px] border ${
															filteringMode === "allow"
																? "bg-[rgba(var(--color-success-rgb),0.05)] text-[var(--color-success)] border-[rgba(var(--color-success-rgb),0.1)]"
																: "bg-[rgba(var(--color-error-rgb),0.05)] text-[var(--color-error)] border-[rgba(var(--color-error-rgb),0.1)]"
														}`}
													>
														<span className="max-w-[180px] truncate">
															{domain}
														</span>
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
													(filteringMode === "allow"
														? allowedDomains
														: blockedDomains
													).length > 0
														? "Add more domains..."
														: "Domain Names (separate with commas)"
												}
												value={domainInput}
												onChange={(e) => {
													setDomainErrors([]);
													setDomainInput(e.target.value);
												}}
												onKeyDown={handleDomainKeyDown}
												onBlur={() => addDomainTags()}
												className="min-w-[200px] flex-1 border-none bg-transparent px-1 py-1 text-[14px] text-white-400 outline-none placeholder:text-white/30"
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
															<span className="font-medium">
																{error.message}:
															</span>{" "}
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
							)}
						</div>
					</>
				)}
			</div>
		</ToolConfigurationDialog>
	);
}
