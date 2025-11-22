import { Input } from "@giselle-internal/ui/input";
import { Select } from "@giselle-internal/ui/select";
import type { ConfigurationOption } from "@giselles-ai/language-model-registry";
import { titleCase } from "@giselles-ai/utils";
import clsx from "clsx/lite";
import { Undo2Icon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
	Slider as SliderPrimitive,
	Switch,
	Tooltip as TooltipPrimitive,
} from "radix-ui";
import { useState } from "react";
import type * as z from "zod/v4";
import { ConfigurationFormFieldLabel } from "./configuration-form-field-label";

function getEnumValues(schema: z.ZodTypeAny): string[] {
	const def = schema.def;
	if (def.type === "enum") {
		return (schema as z.ZodEnum).options.map((option) => `${option}`);
	}
	return [];
}

export function ConfigurationFormField<T extends z.ZodType>({
	name,
	option,
	value,
	defaultValue,
	onValueChange,
}: {
	name: string;
	option: ConfigurationOption<T>;
	value: unknown;
	defaultValue: unknown;
	onValueChange: (value: unknown) => void;
}) {
	const [isHovered, setIsHovered] = useState(false);
	const fieldType = option.schema.def.type;
	const label = option.ui?.label ?? titleCase(name);

	switch (fieldType) {
		case "enum": {
			const enumValues = getEnumValues(option.schema);
			const options = enumValues.map((v) => ({ value: v, label: v }));
			return (
				<div className="flex justify-between">
					<ConfigurationFormFieldLabel
						label={label}
						tooltip={option.description}
					/>
					<Select
						widthClassName="w-fit"
						options={options}
						placeholder={`Select ${name}...`}
						value={String(value ?? "")}
						onValueChange={(v) => onValueChange(v)}
					/>
				</div>
			);
		}
		case "boolean":
			return (
				<div className="flex justify-between">
					<ConfigurationFormFieldLabel
						label={label}
						tooltip={option.description}
					/>

					<Switch.Root
						className={clsx(
							"h-[15px] w-[27px] rounded-full outline-none transition-colors",
							"border border-border-muted data-[state=checked]:border-primary-900",
							"bg-transparent data-[state=checked]:bg-primary-900",
							"disabled:opacity-50 disabled:cursor-not-allowed",
						)}
						checked={Boolean(value)}
						onCheckedChange={(v) => onValueChange(v)}
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
		case "number": {
			const numValue = Number(value ?? 0);
			const numDefaultValue = Number(defaultValue ?? 0);
			const isValueChanged = numValue !== numDefaultValue;
			const step = option.ui?.step ?? 1;
			const min = option.ui?.min ?? 0;
			const max = option.ui?.max ?? Infinity;
			return (
				<fieldset
					className="flex flex-col gap-[8px]"
					onMouseEnter={() => setIsHovered(true)}
					onMouseLeave={() => setIsHovered(false)}
				>
					<div className="flex justify-between">
						<ConfigurationFormFieldLabel
							label={label}
							tooltip={option.description}
						/>

						<div className="flex items-center gap-[4px]">
							<AnimatePresence>
								{isValueChanged && isHovered && (
									<motion.div
										initial={{ opacity: 0, scale: 0.8 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.8 }}
										transition={{ duration: 0.2 }}
									>
										<TooltipPrimitive.Provider delayDuration={0}>
											<TooltipPrimitive.Root>
												<TooltipPrimitive.Trigger
													className="cursor-pointer hover:bg-element-hover size-[16px] flex items-center justify-center rounded-[2px]"
													onClick={() => onValueChange(defaultValue)}
												>
													<Undo2Icon className="size-[14px]" />
												</TooltipPrimitive.Trigger>
												<TooltipPrimitive.Portal>
													<TooltipPrimitive.Content
														side="top"
														align="center"
														className={clsx(
															"group z-50 overflow-hidden rounded-md p-2 text-[12px] shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 max-w-[300px]",
															"bg-surface text-inverse",
														)}
														sideOffset={2}
													>
														Reset to default
													</TooltipPrimitive.Content>
												</TooltipPrimitive.Portal>
											</TooltipPrimitive.Root>
										</TooltipPrimitive.Provider>
									</motion.div>
								)}
							</AnimatePresence>
							<p className="text-[12px] font-[700] text-inverse text-right font-mono [font-variant-numeric:tabular-nums]">
								{numValue.toFixed(2)}
							</p>
						</div>
					</div>
					<SliderPrimitive.Root
						className="relative flex w-full touch-none select-none items-center flex-1"
						max={max}
						min={min}
						step={step}
						value={[numValue]}
						onValueChange={(v) => onValueChange?.(v[0])}
					>
						<SliderPrimitive.Track
							className="relative h-[2px] w-full grow overflow-hidden bg-transparent
											before:content-[''] before:absolute before:inset-0
											before:bg-[repeating-linear-gradient(90deg,#F7F9FD_0px,#F7F9FD_2px,transparent_2px,transparent_4px)]"
						>
							<SliderPrimitive.Range className="absolute h-full bg-text-inverse rounded-[9999px]" />
						</SliderPrimitive.Track>
						<SliderPrimitive.Thumb className="block h-[10px] w-[10px] rounded-full bg-text-inverse transition-transform hover:scale-110 focus:outline-none focus:ring-0 active:outline-none active:ring-0 cursor-grab" />
					</SliderPrimitive.Root>
				</fieldset>
			);
		}
		default:
			return (
				<div className="flex flex-col gap-[4px]">
					<ConfigurationFormFieldLabel
						label={label}
						tooltip={option.description}
					/>
					<Input
						type="text"
						value={String(value ?? "")}
						onChange={(e) => onValueChange(e.target.value)}
					/>
				</div>
			);
	}
}
