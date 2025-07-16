import { Button } from "@giselle-internal/ui/button";
import {
	ManualTriggerParameter,
	ManualTriggerParameterId,
	type Output,
	OutputId,
	type TriggerNode,
} from "@giselle-sdk/data-type";
import {
	useFeatureFlag,
	useGiselleEngine,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle-engine/react";
import { Check, ChevronDown, TrashIcon } from "lucide-react";
import {
	type FormEventHandler,
	useCallback,
	useEffect,
	useRef,
	useState,
	useTransition,
} from "react";
import { SpinnerIcon } from "../../../../../icons";
import { ManualTriggerConfiguredView } from "../../ui";

const TYPE_OPTIONS = [
	{ id: "text", label: "Text" },
	{ id: "multiline-text", label: "Text (multi-line)" },
	{ id: "number", label: "Number" },
] as const;

export function ManualTriggerPropertiesPanel({ node }: { node: TriggerNode }) {
	const { data: workspace, updateNodeData } = useWorkflowDesigner();
	const client = useGiselleEngine();
	const [isPending, startTransition] = useTransition();
	const [parameters, setParameters] = useState<ManualTriggerParameter[]>([]);
	const [selectedType, setSelectedType] = useState("text");
	const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const { experimental_storage } = useFeatureFlag();

	const handleAddParameter = useCallback<FormEventHandler<HTMLFormElement>>(
		(e) => {
			e.preventDefault();
			const formData = new FormData(e.currentTarget);
			const name = formData.get("name") as string;
			const required = formData.get("required") !== null;

			if (!name.trim()) return;

			const parse = ManualTriggerParameter.safeParse({
				id: ManualTriggerParameterId.generate(),
				name: name.trim(),
				type: selectedType,
				required,
			});

			if (parse.success) {
				setParameters((prev) => [...prev, parse.data]);
				e.currentTarget.reset();
				setSelectedType("text");
			}
		},
		[selectedType],
	);

	const handleRemoveParameter = useCallback((id: string) => {
		setParameters((prev) => prev.filter((param) => param.id !== id));
	}, []);

	// Handle click outside to close dropdown
	useEffect(() => {
		if (!isTypeDropdownOpen) return;

		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsTypeDropdownOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isTypeDropdownOpen]);

	const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
		(e) => {
			e.preventDefault();
			if (parameters.length === 0) return;

			const outputs: Output[] = parameters.map((param) => ({
				id: OutputId.generate(),
				label: param.name,
				accessor: param.id,
			}));

			startTransition(async () => {
				const { triggerId } = await client.configureTrigger({
					trigger: {
						nodeId: node.id,
						workspaceId: workspace?.id,
						enable: true,
						configuration: {
							provider: "manual",
							event: {
								id: "manual",
								parameters,
							},
						},
					},
					useExperimentalStorage: experimental_storage,
				});

				updateNodeData(node, {
					content: {
						...node.content,
						state: {
							status: "configured",
							flowTriggerId: triggerId,
						},
					},
					outputs,
					name: "Manual Trigger",
				});
			});
		},
		[
			parameters,
			client,
			node,
			workspace?.id,
			updateNodeData,
			experimental_storage,
		],
	);

	if (node.content.state.status === "configured") {
		return <ManualTriggerConfiguredView node={node} />;
	}

	return (
		<div className="flex flex-col gap-[8px] h-full px-1">
			<div className="overflow-y-auto flex-1 pr-2 custom-scrollbar h-full relative">
				<div className="space-y-[4px]">
					<p className="text-[14px] py-[1.5px] text-[#F7F9FD]">
						Output Parameter
					</p>
					<div className="px-[4px] py-0 w-full bg-transparent text-[14px]">
						{parameters.length > 0 ? (
							<div className="flex flex-col gap-[8px] mb-[16px]">
								{parameters.map((param) => (
									<div
										key={param.id}
										className="flex items-center justify-between p-[8px] bg-white-900/10 rounded-[4px]"
									>
										<div className="flex items-center gap-[8px]">
											<span className="font-medium">{param.name}</span>
											<span className="text-[12px] text-black-500">
												{param.type}
												{param.required ? " (required)" : ""}
											</span>
										</div>
										<button
											type="button"
											onClick={() => handleRemoveParameter(param.id)}
											className="text-black-500 hover:text-black-900"
										>
											<TrashIcon className="size-[16px]" />
										</button>
									</div>
								))}
							</div>
						) : (
							<div className="text-[14px] text-white-400 mb-[16px]">
								No parameters configured yet. Add at least one parameter.
							</div>
						)}
					</div>
				</div>

				<div className="space-y-[4px] mt-[16px]">
					<div className="flex flex-col gap-[8px] rounded-[8px]">
						<form
							className="flex gap-[8px] items-end"
							onSubmit={handleAddParameter}
						>
							<div className="flex-1">
								<label
									htmlFor="param-name"
									className="text-[12px] text-black-500 mb-[4px] block"
								>
									Parameter Name
								</label>
								<input
									id="param-name"
									name="name"
									type="text"
									placeholder="Write the parameter name"
									className="w-full flex justify-between items-center rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none border-[1px] border-white-900 text-[14px]"
								/>
							</div>
							<div className="w-[100px]">
								<label
									htmlFor="param-type"
									className="text-[12px] text-black-500 mb-[4px] block leading-[16px]"
								>
									Type
								</label>
								<div className="relative" ref={dropdownRef}>
									<button
										type="button"
										onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
										className="w-full px-3 py-2 bg-black-300/20 rounded-[8px] text-white-400 text-[14px] font-geist cursor-pointer text-left flex items-center justify-between"
									>
										<span className="text-[#F7F9FD]">
											{TYPE_OPTIONS.find((opt) => opt.id === selectedType)
												?.label || "Text"}
										</span>
										<ChevronDown className="h-4 w-4 text-white/60" />
									</button>
									{isTypeDropdownOpen && (
										<div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-[8px] border-[0.25px] border-white/10 bg-black-850 p-1 shadow-none">
											{TYPE_OPTIONS.map((option) => (
												<button
													key={option.id}
													type="button"
													onClick={() => {
														setSelectedType(option.id);
														setIsTypeDropdownOpen(false);
													}}
													className="flex w-full items-center rounded-md px-3 py-2 text-left font-sans text-[14px] leading-[16px] text-[#F7F9FD] hover:bg-white/5"
												>
													<span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
														{selectedType === option.id && (
															<Check className="h-4 w-4" />
														)}
													</span>
													{option.label}
												</button>
											))}
										</div>
									)}
								</div>
							</div>
							<div className="w-auto">
								<label
									htmlFor="param-required"
									className="text-[12px] text-black-500 mb-[4px] block leading-[16px]"
								>
									Required
								</label>
								<div className="flex items-center justify-center h-[37px]">
									<input id="param-required" type="checkbox" name="required" />
								</div>
							</div>
							<Button type="submit" variant="solid" size="large">
								Add
							</Button>
						</form>
					</div>
				</div>

				<div className="pt-[8px] flex gap-[8px] mt-[12px] px-[4px]">
					<form onSubmit={handleSubmit} className="w-full">
						<button
							type="submit"
							className="w-full bg-primary-900 hover:bg-primary-800 text-white font-medium px-4 py-2 rounded-md text-[14px] transition-colors disabled:opacity-50 relative"
							disabled={isPending}
						>
							<span className={isPending ? "opacity-0" : ""}>
								{isPending ? "Setting up..." : "Save Configuration"}
							</span>
							{isPending && (
								<span className="absolute inset-0 flex items-center justify-center">
									<SpinnerIcon className="animate-follow-through-overlap-spin size-[18px]" />
								</span>
							)}
						</button>
					</form>
				</div>
			</div>

			<style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.15);
          border-radius: 2px;
        }
      `}</style>
		</div>
	);
}
