import { Button } from "@giselle-internal/ui/button";
import { Select } from "@giselle-internal/ui/select";
import {
	App,
	type AppEntryNode,
	AppId,
	AppParameterId,
	type DraftApp,
	type DraftAppParameter,
	DraftAppParameterId,
	OutputId,
} from "@giselles-ai/protocol";
import { useGiselle, useWorkflowDesigner } from "@giselles-ai/react";
import clsx from "clsx/lite";
import { TrashIcon } from "lucide-react";
import {
	type FormEventHandler,
	useCallback,
	useState,
	useTransition,
} from "react";
import * as z from "zod/v4";
import { SpinnerIcon } from "../../../icons";
import { SettingDetail, SettingLabel } from "../ui/setting-label";
import { AppIconSelect } from "./app-icon-select";

const TYPE_OPTIONS = [
	{ value: "text", label: "Text" },
	{ value: "multiline-text", label: "Text (multi-line)" },
	{ value: "number", label: "Number" },
	{ value: "files", label: "Files" },
];

type ValidationErrors = {
	name?: string;
	iconName?: string;
	parameters?: Record<number, { name?: string }>;
};

type TreeifiedError = {
	errors: string[];
	properties?: {
		[key: string]:
			| TreeifiedError
			| { errors: string[]; items?: TreeifiedError[] };
	};
	items?: TreeifiedError[];
};

function parseZodErrors(treeifiedError: TreeifiedError): ValidationErrors {
	const errors: ValidationErrors = {};

	if (treeifiedError.properties) {
		// Handle top-level properties (name, iconName)
		if (treeifiedError.properties.name?.errors?.[0]) {
			errors.name = treeifiedError.properties.name.errors[0];
		}
		if (treeifiedError.properties.iconName?.errors?.[0]) {
			errors.iconName = treeifiedError.properties.iconName.errors[0];
		}

		// Handle parameters array
		const parametersProperty = treeifiedError.properties.parameters;
		if (
			parametersProperty &&
			"items" in parametersProperty &&
			parametersProperty.items
		) {
			errors.parameters = {};
			for (let i = 0; i < parametersProperty.items.length; i++) {
				const item = parametersProperty.items[i];
				if (item.properties?.name?.errors?.[0]) {
					errors.parameters[i] = {
						name: item.properties.name.errors[0],
					};
				}
			}
		}
	}

	return errors;
}

interface ParameterRowProps {
	param: DraftAppParameter;
	index: number;
	nameError?: string;
	showOptional: boolean;
	onNameChange: (value: string) => void;
	onTypeChange: (value: DraftAppParameter["type"]) => void;
	onToggleOptional: () => void;
	onRemove?: () => void;
}

function ParameterRow({
	param,
	index,
	nameError,
	showOptional,
	onNameChange,
	onTypeChange,
	onToggleOptional,
	onRemove,
}: ParameterRowProps) {
	return (
		<div className="rounded-[8px] bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_5%,transparent)] px-[8px] py-[8px]">
			<div className="flex items-start justify-between gap-[8px] mb-[12px]">
				<span className="text-[14px] font-medium">Parameter {index + 1}</span>
				{onRemove && (
					<button
						type="button"
						onClick={onRemove}
						className="text-text hover:text-text transition-colors cursor-pointer"
					>
						<TrashIcon className="size-[16px]" />
					</button>
				)}
			</div>
			<div className="grid grid-cols-[80px_1fr] items-start gap-x-[12px] gap-y-[12px]">
				<SettingDetail className="pl-[4px]">
					Name <span className="text-red-500">*</span>
				</SettingDetail>
				<div className="flex flex-col gap-[4px]">
					<input
						type="text"
						placeholder="Parameter name"
						value={param.name}
						onChange={(e) => {
							onNameChange(e.target.value);
						}}
						className={clsx(
							"w-full rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] text-inverse text-[14px]",
							nameError ? "border border-red-500" : "border-none",
						)}
						data-1p-ignore
					/>
					{nameError && (
						<span className="text-[12px] text-red-500">{nameError}</span>
					)}
				</div>

				<SettingDetail className="pl-[4px]">
					Type <span className="text-red-500">*</span>
				</SettingDetail>
				<Select
					options={TYPE_OPTIONS}
					placeholder="Select type..."
					value={param.type}
					onValueChange={(value) =>
						onTypeChange(
							value as "text" | "multiline-text" | "number" | "files",
						)
					}
				/>

				{showOptional && (
					<>
						<SettingDetail className="pl-[4px]">Optional</SettingDetail>
						<div className="flex items-center gap-[8px] h-[37px]">
							<input
								type="checkbox"
								checked={!param.required}
								onChange={onToggleOptional}
							/>
							<span className="text-[12px] text-black-500">Optional field</span>
						</div>
					</>
				)}
			</div>
		</div>
	);
}

export function AppEntryConfigurationView({
	node,
	draftApp,
}: {
	node: AppEntryNode;
	draftApp: DraftApp;
}) {
	const [isPending, startTransition] = useTransition();
	const [appName, setAppName] = useState(draftApp.name);
	const [appDescription, setAppDescription] = useState(draftApp.description);
	const [appIconName, setAppIconName] = useState(draftApp.iconName || "cable");
	const [draftAppParameters, setDraftAppParameters] = useState<
		DraftAppParameter[]
	>(draftApp.parameters);
	const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
		{},
	);
	const client = useGiselle();
	const {
		updateNodeData,
		data: { id: workspaceId },
	} = useWorkflowDesigner();

	const handleAddParameter = useCallback(() => {
		setDraftAppParameters((prev) => [
			...prev,
			{
				id: DraftAppParameterId.generate(),
				name: "",
				type: "text",
				required: false,
			},
		]);
	}, []);

	const handleRemoveParameter = useCallback(
		(parameterId: DraftAppParameterId) => {
			setDraftAppParameters((prev) =>
				prev.filter(
					(draftAppParameter) => draftAppParameter.id !== parameterId,
				),
			);
		},
		[],
	);

	const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
		(e) => {
			e.preventDefault();
			const appId = AppId.generate();
			const appLike: App = {
				id: appId,
				name: appName,
				description: appDescription,
				iconName: appIconName,
				parameters: draftAppParameters.map((draftAppParameter) => ({
					id: AppParameterId.generate(),
					type: draftAppParameter.type,
					name: draftAppParameter.name,
					required: draftAppParameter.required,
				})),
				entryNodeId: node.id,
				workspaceId,
			};
			const parseResult = App.safeParse(appLike);
			if (!parseResult.success) {
				const treeifiedError = z.treeifyError(parseResult.error);
				setValidationErrors(parseZodErrors(treeifiedError));
				return;
			}
			setValidationErrors({});

			startTransition(async () => {
				await client.saveApp({ app: parseResult.data });
				updateNodeData(node, {
					name: parseResult.data.name,
					outputs: parseResult.data.parameters.map((parameter) => ({
						id: OutputId.generate(),
						label: parameter.name,
						accessor: parameter.id,
					})),
					content: {
						...node.content,
						status: "configured",
						appId,
					},
				});
			});
		},
		[
			appName,
			appDescription,
			appIconName,
			draftAppParameters,
			client,
			node,
			updateNodeData,
			workspaceId,
		],
	);

	return (
		<div className="flex flex-col gap-[8px] h-full">
			<div className="overflow-y-auto flex-1 custom-scrollbar h-full relative space-y-[16px]">
				{/* App Basic Information */}
				<div>
					<SettingLabel className="py-[1.5px]">App Information</SettingLabel>
					<div className="py-0 w-full bg-transparent text-[14px]">
						<div className="grid grid-cols-[80px_1fr] items-start gap-x-[12px] gap-y-[12px]">
							<SettingDetail>App Name</SettingDetail>
							<div className="flex flex-col gap-[4px]">
								<input
									id="app-name"
									type="text"
									placeholder="Enter app name"
									value={appName}
									onChange={(e) => {
										setAppName(e.target.value);
										if (validationErrors.name) {
											setValidationErrors((prev) => ({
												...prev,
												name: undefined,
											}));
										}
									}}
									className={clsx(
										"w-full rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] text-inverse text-[14px]",
										validationErrors.name
											? "border border-red-500"
											: "border-none",
									)}
									data-1p-ignore
								/>
								{validationErrors.name && (
									<span className="text-[12px] text-red-500">
										{validationErrors.name}
									</span>
								)}
							</div>

							<SettingDetail>Description</SettingDetail>
							<textarea
								id="app-description"
								placeholder="Enter app description"
								value={appDescription}
								onChange={(e) => setAppDescription(e.target.value)}
								className="w-full rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none border-none bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] text-inverse text-[14px] resize-none"
								rows={3}
								data-1p-ignore
							/>

							<SettingDetail>Icon</SettingDetail>
							<div className="flex justify-end">
								<AppIconSelect
									value={appIconName}
									onValueChange={(value) => setAppIconName(value)}
								/>
							</div>
						</div>
					</div>
				</div>

				{/* Parameters */}
				<div className="space-y-[4px]">
					<SettingLabel className="py-[1.5px]">Parameters</SettingLabel>
					<div className="py-0 w-full bg-transparent text-[14px]">
						{draftAppParameters.length > 0 && (
							<div className="flex flex-col gap-[12px] mb-[16px]">
								{draftAppParameters.map((param, index) => (
									<ParameterRow
										key={param.id}
										param={param}
										index={index}
										nameError={validationErrors.parameters?.[index]?.name}
										showOptional={index > 0}
										onNameChange={(value) => {
											setDraftAppParameters((prev) =>
												prev.map((p) =>
													p.id === param.id ? { ...p, name: value } : p,
												),
											);
											if (validationErrors.parameters?.[index]?.name) {
												setValidationErrors((prev) => {
													const next = { ...prev };
													if (!next.parameters?.[index]) {
														return next;
													}
													const nextParams = { ...next.parameters };
													delete nextParams[index].name;
													if (Object.keys(nextParams[index]).length === 0) {
														delete nextParams[index];
													}
													next.parameters =
														Object.keys(nextParams).length > 0
															? nextParams
															: undefined;
													return next;
												});
											}
										}}
										onTypeChange={(value) => {
											setDraftAppParameters((prev) =>
												prev.map((p) =>
													p.id === param.id ? { ...p, type: value } : p,
												),
											);
										}}
										onToggleOptional={() => {
											setDraftAppParameters((prev) =>
												prev.map((p) =>
													p.id === param.id
														? { ...p, required: !p.required }
														: p,
												),
											);
										}}
										onRemove={
											index > 0
												? () => handleRemoveParameter(param.id)
												: undefined
										}
									/>
								))}
							</div>
						)}

						<div className="flex mb-[16px]">
							<button
								type="button"
								onClick={handleAddParameter}
								className="relative flex items-center justify-center outline-none overflow-hidden focus-visible:ring-2 focus-visible:ring-primary-700/60 focus-visible:ring-offset-1 data-[size=default]:px-[8px] data-[size=default]:py-[2px] data-[size=default]:rounded-[2px] data-[size=default]:gap-[4px] data-[size=large]:px-6 data-[size=large]:h-[38px] data-[size=large]:rounded-lg data-[size=large]:gap-[6px] data-[size=compact]:px-[4px] data-[size=compact]:py-[0px] data-[size=compact]:rounded-[2px] data-[size=compact]:gap-[2px] data-[style=subtle]:hover:bg-ghost-element-hover data-[style=filled]:bg-background data-[style=filled]:border data-[style=filled]:border-border data-[style=filled]:hover:bg-ghost-element-hover data-[style=solid]:bg-(image:--solid-button-bg) data-[style=solid]:text-inverse data-[style=solid]:border data-[style=solid]:border-button-solid-border data-[style=solid]:shadow-(--solid-button-shadow) data-[style=solid]:hover:bg-primary-800 data-[style=glass]:shadow-glass data-[style=glass]:backdrop-blur-md data-[style=glass]:rounded-lg data-[style=glass]:px-4 data-[style=glass]:py-2 data-[style=glass]:after:absolute data-[style=glass]:after:bg-linear-to-r data-[style=glass]:after:from-transparent data-[style=glass]:after:via-glass-highlight/60 data-[style=glass]:after:left-4 data-[style=glass]:after:right-4 data-[style=glass]:after:h-px data-[style=glass]:after:top-0 data-[style=glass]:border data-[style=glass]:border-glass-border/20 data-[style=outline]:border data-[style=outline]:border-t-border/60 data-[style=outline]:border-x-border/40 data-[style=outline]:border-b-black/60 data-[style=link]:p-0 data-[style=link]:h-auto data-[style=link]:hover:underline data-[style=primary]:text-white/80 data-[style=primary]:bg-gradient-to-b data-[style=primary]:from-[#202530] data-[style=primary]:to-[#12151f] data-[style=primary]:border data-[style=primary]:border-black/70 data-[style=primary]:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_2px_8px_rgba(5,10,20,0.4),0_1px_2px_rgba(0,0,0,0.3)] data-[style=primary]:transition-all data-[style=primary]:duration-200 data-[style=primary]:active:scale-[0.98] data-[style=destructive]:bg-error-900/10 data-[style=destructive]:text-error-900 data-[style=destructive]:border data-[style=destructive]:border-error-900/20 data-[style=destructive]:hover:bg-error-900/20 cursor-pointer transition-colors w-full"
								data-style="filled"
								data-size="large"
							>
								<div className="text-[13px] text-text">
									<span>Add Parameter</span>
								</div>
							</button>
						</div>
					</div>
				</div>

				<div className="pt-[8px] flex gap-[8px] mt-[12px] justify-end">
					<form onSubmit={handleSubmit} className="w-full flex justify-end">
						<Button
							type="submit"
							variant="solid"
							className="w-full"
							size="large"
							disabled={isPending}
							leftIcon={
								isPending && (
									<SpinnerIcon className="animate-follow-through-overlap-spin size-[18px]" />
								)
							}
						>
							<span>{isPending ? "Creating..." : "Create App"}</span>
						</Button>
					</form>
				</div>
			</div>
		</div>
	);
}
