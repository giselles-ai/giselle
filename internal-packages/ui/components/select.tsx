import clsx from "clsx/lite";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";
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
	itemClassNameForOption?: (option: T) => string | undefined;
	disabled?: boolean;
	renderTriggerContent?: React.ReactNode;
	hideChevron?: boolean;
	ariaLabel?: string;
	contentMinWidthClassName?: string;
	disableHoverBg?: boolean;
	/** Hide the check icon indicator for selected items (for action menus). */
	hideItemIndicator?: boolean;
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
	itemClassNameForOption,
	disabled,
	renderTriggerContent,
	hideChevron,
	ariaLabel,
	contentMinWidthClassName,
	disableHoverBg,
	hideItemIndicator,
}: SelectProps<T>) {
	return (
		<SelectPrimitive.Root
			value={value}
			onValueChange={onValueChange}
			defaultValue={defaultValue}
			name={name}
		>
			<SelectPrimitive.Trigger id={id} asChild>
				<button
					type="button"
					className={clsx(
						// width: default full, but allow override via widthClassName
						widthClassName ?? "w-full",
						"flex justify-between items-center rounded-[8px] h-10 px-[8px] text-left text-[14px] shrink-0",
						"outline-none focus:outline-none focus-visible:outline-none focus:ring-0",
						renderTriggerContent
							? clsx(
									"bg-transparent transition-colors",
									disableHoverBg ? undefined : "hover:bg-white/5",
								)
							: "bg-inverse/5 transition-colors hover:bg-inverse/10",
						"disabled:opacity-50 disabled:cursor-not-allowed",
						"data-[placeholder]:text-text-muted",
						triggerClassName,
					)}
					disabled={disabled}
					aria-label={ariaLabel}
				>
					{renderTriggerContent ? (
						<div className="flex-1 flex items-center justify-center">
							{renderTriggerContent}
						</div>
					) : (
						<div className="flex-1 min-w-0 text-ellipsis overflow-hidden whitespace-nowrap">
							<SelectPrimitive.Value placeholder={placeholder} />
						</div>
					)}
					{!hideChevron && (
						<ChevronDownIcon className="size-[13px] shrink-0 text-text ml-2" />
					)}
				</button>
			</SelectPrimitive.Trigger>
			<SelectPrimitive.Portal>
				<SelectPrimitive.Content
					position="popper"
					sideOffset={4}
					className={clsx(
						contentMinWidthClassName ?? "min-w-(--radix-select-trigger-width)",
						"z-50",
					)}
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
										"outline-none cursor-pointer hover:bg-white/5",
										"rounded-[4px] px-[8px] py-[6px] text-[14px]",
										"flex items-center justify-between gap-[4px]",
										"data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed data-[disabled]:pointer-events-none",
										itemClassNameForOption?.(option),
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
									{!hideItemIndicator && (
										<SelectPrimitive.ItemIndicator>
											<CheckIcon className="size-[13px]" />
										</SelectPrimitive.ItemIndicator>
									)}
								</SelectPrimitive.Item>
							))}
						</SelectPrimitive.Viewport>
					</PopoverContent>
				</SelectPrimitive.Content>
			</SelectPrimitive.Portal>
		</SelectPrimitive.Root>
	);
}
