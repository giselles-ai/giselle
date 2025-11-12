import { Button } from "@giselle-internal/ui/button";
import { Select } from "@giselle-internal/ui/select";
import {
	SettingDetail,
	SettingLabel,
} from "@giselle-internal/ui/setting-label";
import {
	useGiselleEngine,
	useWorkflowDesigner,
} from "@giselles-ai/giselle/react";
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
import clsx from "clsx/lite";
import { PlusIcon, TrashIcon } from "lucide-react";
import {
	type FormEventHandler,
	useCallback,
	useState,
	useTransition,
} from "react";
import * as z from "zod/v4";
import { SpinnerIcon } from "../../../icons";

const TYPE_OPTIONS = [
	{ value: "text", label: "Text" },
	{ value: "multiline-text", label: "Text (multi-line)" },
	{ value: "number", label: "Number" },
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
	const [appIconName, setAppIconName] = useState<string>(draftApp.iconName);
	const [draftAppParameters, setDraftAppParameters] = useState<
		DraftAppParameter[]
	>(draftApp.parameters);
	const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
		{},
	);
	const client = useGiselleEngine();
	const { updateNodeData } = useWorkflowDesigner();

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
			const parseResult = App.safeParse({
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
			});
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
		],
	);

	return (
		<div className="flex flex-col gap-[8px] h-full px-1">
			<div className="overflow-y-auto flex-1 pr-2 custom-scrollbar h-full relative space-y-[16px]">
				{/* App Basic Information */}
				<div className="space-y-[4px]">
					<SettingLabel className="py-[1.5px]">App Information</SettingLabel>
					<div className="px-[4px] py-0 w-full bg-transparent text-[14px]">
						<div className="space-y-[12px]">
							<div className="flex flex-col gap-[4px]">
								<SettingDetail>App Name</SettingDetail>
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

							<div className="flex flex-col gap-[4px]">
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
							</div>

							<div className="flex flex-col gap-[4px]">
								<SettingDetail>Icon Name</SettingDetail>
								<input
									id="app-icon-name"
									type="text"
									placeholder="Enter icon name"
									value={appIconName}
									onChange={(e) => {
										setAppIconName(e.target.value);
										if (validationErrors.iconName) {
											setValidationErrors((prev) => ({
												...prev,
												iconName: undefined,
											}));
										}
									}}
									className={clsx(
										"w-full rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] text-inverse text-[14px]",
										validationErrors.iconName
											? "border border-red-500"
											: "border-none",
									)}
									data-1p-ignore
								/>
								{validationErrors.iconName && (
									<span className="text-[12px] text-red-500">
										{validationErrors.iconName}
									</span>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Parameters */}
				<div className="space-y-[4px]">
					<SettingLabel className="py-[1.5px]">Parameters</SettingLabel>
					<div className="px-[4px] py-0 w-full bg-transparent text-[14px]">
						{draftAppParameters.length > 0 && (
							<div className="flex flex-col gap-[12px] mb-[16px]">
								{draftAppParameters.map((param, index) => (
									<div
										key={param.id}
										className="relative p-[12px] bg-bg-900/10 rounded-[8px] border border-border"
									>
										<div className="flex items-start justify-between mb-[12px]">
											<span className="text-[14px] font-medium">
												Parameter {index + 1}
											</span>
											{index > 0 && (
												<button
													type="button"
													onClick={() => handleRemoveParameter(param.id)}
													className="text-text hover:text-text transition-colors cursor-pointer"
												>
													<TrashIcon className="size-[16px]" />
												</button>
											)}
										</div>
										<div className="space-y-[12px]">
											<div className="flex flex-col gap-[4px]">
												<SettingDetail>Name *</SettingDetail>
												<input
													type="text"
													placeholder="Parameter name"
													value={param.name}
													onChange={(e) => {
														setDraftAppParameters((prev) =>
															prev.map((p) =>
																p.id === param.id
																	? { ...p, name: e.target.value }
																	: p,
															),
														);
														if (validationErrors.parameters?.[index]?.name) {
															setValidationErrors((prev) => {
																const newErrors = { ...prev };
																if (newErrors.parameters?.[index]) {
																	const newParams = {
																		...newErrors.parameters,
																	};
																	delete newParams[index].name;
																	if (
																		Object.keys(newParams[index]).length === 0
																	) {
																		delete newParams[index];
																	}
																	newErrors.parameters =
																		Object.keys(newParams).length > 0
																			? newParams
																			: undefined;
																}
																return newErrors;
															});
														}
													}}
													className={clsx(
														"w-full rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] text-inverse text-[14px]",
														validationErrors.parameters?.[index]?.name
															? "border border-red-500"
															: "border-none",
													)}
													data-1p-ignore
												/>
												{validationErrors.parameters?.[index]?.name && (
													<span className="text-[12px] text-red-500">
														{validationErrors.parameters[index].name}
													</span>
												)}
											</div>
											<div className="flex flex-col gap-[4px]">
												<SettingDetail>Type *</SettingDetail>
												<Select
													options={TYPE_OPTIONS}
													placeholder="Select type..."
													value={param.type}
													onValueChange={(value) =>
														setDraftAppParameters((prev) =>
															prev.map((p) =>
																p.id === param.id
																	? {
																			...p,
																			type: value as
																				| "text"
																				| "multiline-text"
																				| "number",
																		}
																	: p,
															),
														)
													}
												/>
											</div>
											{index > 0 && (
												<div className="flex flex-col gap-[4px]">
													<SettingDetail>Optional</SettingDetail>
													<div className="flex items-center gap-[8px] h-[37px]">
														<input
															type="checkbox"
															checked={!param.required}
															onChange={(e) =>
																setDraftAppParameters((prev) =>
																	prev.map((p) =>
																		p.id === param.id
																			? {
																					...p,
																					required: !e.target.checked,
																				}
																			: p,
																	),
																)
															}
														/>
														<span className="text-[12px] text-black-500">
															Optional field
														</span>
													</div>
												</div>
											)}
										</div>
									</div>
								))}
							</div>
						)}

						<div className="flex mb-[16px]">
							<button
								type="button"
								onClick={handleAddParameter}
								className="relative w-full p-[12px] bg-bg-900 rounded-[8px] border border-dotted border-border h-[48px] flex items-center gap-2 justify-center cursor-pointer hover:bg-white/5 transition-colors"
							>
								<PlusIcon className="size-[14px]" />
								<span>Add Parameter</span>
							</button>
						</div>
					</div>
				</div>

				<div className="pt-[8px] flex gap-[8px] mt-[12px] px-[4px] justify-end">
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
