import clsx from "clsx/lite";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";
import { useState } from "react";
import { PopoverContent } from "./popover";

export type SelectOption = {
	value: string | number;
	label: string;
	icon?: React.ReactNode;
	disabled?: boolean;
};

interface SelectProps<T extends SelectOption> {
	options: Array<T>;
	renderOption?: (option: T) => React.ReactNode;
	placeholder: string;
	value?: string;
	onValueChange?: (value: string) => void;
	defaultValue?: string;
	widthClassName?: string;
	triggerClassName?: string;
	name?: string;
	id?: string;
	renderValue?: (options: T) => string | number;
	showIconInTrigger?: boolean;
}

export function Select<T extends SelectOption>({
	renderOption,
	options,
	placeholder,
	value,
	onValueChange,
	defaultValue,
	widthClassName,
	triggerClassName,
	name,
	id,
	renderValue,
	showIconInTrigger,
}: SelectProps<T>) {
	const [internalValue, setInternalValue] = useState<string | undefined>(
		value ?? defaultValue,
	);
	const selectedValue = value ?? internalValue ?? defaultValue;
	const selectedOption = options.find(
		(option) =>
			(renderValue ? `${renderValue(option)}` : `${option.value}`) ===
			selectedValue,
	);
	const handleChange = (next: string) => {
		onValueChange?.(next);
		if (showIconInTrigger) setInternalValue(next);
	};
	return (
		<SelectPrimitive.Root
			value={value}
			onValueChange={handleChange}
			defaultValue={defaultValue}
			name={name}
		>
			<SelectPrimitive.Trigger id={id} asChild>
				<button
					type="button"
					className={clsx(
						"w-full flex justify-between items-center rounded-[8px] h-10 px-[12px] text-left text-[14px]",
						"outline-none focus:outline-none focus-visible:outline-none focus:ring-0",
						"bg-white/5 transition-colors hover:bg-ghost-element-hover",
						"data-[placeholder]:text-text-muted",
						widthClassName,
						triggerClassName,
					)}
				>
					<div className="flex-1 min-w-0 text-ellipsis overflow-hidden whitespace-nowrap flex items-center gap-3">
						{showIconInTrigger && selectedOption?.icon ? (
							<span className="h-6 w-6 shrink-0 rounded-full overflow-hidden">
								{selectedOption.icon}
							</span>
						) : null}
						{showIconInTrigger ? (
							<span className="truncate">
								{selectedOption
									? renderOption
										? renderOption(selectedOption as T)
										: (selectedOption.label as React.ReactNode)
									: placeholder}
							</span>
						) : (
							<SelectPrimitive.Value placeholder={placeholder} />
						)}
					</div>
					<ChevronDownIcon className="size-[13px] shrink-0 text-text ml-2" />
				</button>
			</SelectPrimitive.Trigger>
			<SelectPrimitive.Portal>
				<SelectPrimitive.Content
					position="popper"
					sideOffset={4}
					className={clsx("min-w-(--radix-select-trigger-width) z-50")}
				>
					<PopoverContent>
						<SelectPrimitive.Viewport>
							{options.map((option) => (
								<SelectPrimitive.Item
									key={option.value}
									value={
										renderValue ? `${renderValue(option)}` : `${option.value}`
									}
									disabled={option.disabled}
									className={clsx(
										"text-text outline-none cursor-pointer hover:bg-ghost-element-hover",
										"rounded-[4px] px-[8px] py-[6px] text-[14px]",
										"flex items-center justify-between gap-[4px]",
										"data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed data-[disabled]:pointer-events-none",
									)}
								>
									<SelectPrimitive.ItemText>
										{option.icon ? (
											<div className="flex items-center gap-2">
												<span className="h-4 w-4">{option.icon}</span>
												{renderOption ? renderOption(option) : option.label}
											</div>
										) : renderOption ? (
											renderOption(option)
										) : (
											option.label
										)}
									</SelectPrimitive.ItemText>
									<SelectPrimitive.ItemIndicator>
										<CheckIcon className="size-[13px]" />
									</SelectPrimitive.ItemIndicator>
								</SelectPrimitive.Item>
							))}
						</SelectPrimitive.Viewport>
					</PopoverContent>
				</SelectPrimitive.Content>
			</SelectPrimitive.Portal>
		</SelectPrimitive.Root>
	);
}
