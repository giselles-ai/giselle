import clsx from "clsx/lite";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";
import { Button } from "./button";
import { PopoverContent } from "./popover";

type SelectOption = {
	value: string | number;
	label: string;
	icon?: React.ReactNode;
};

interface SelectProps<T extends SelectOption> {
	options: Array<T>;
	renderOption?: (option: T) => React.ReactNode;
	placeholder: string;
	value?: string;
	onValueChange?: (value: string) => void;
	defaultValue?: string;
	widthClassName?: string;
	name?: string;
	id?: string;
	renderValue?: (options: T) => string | number;
}

export function Select<T extends SelectOption>({
	renderOption,
	options,
	placeholder,
	value,
	onValueChange,
	defaultValue,
	widthClassName,
	name,
	id,
	renderValue,
}: SelectProps<T>) {
	return (
		<SelectPrimitive.Root
			value={value}
			onValueChange={onValueChange}
			defaultValue={defaultValue}
			name={name}
		>
			<SelectPrimitive.Trigger id={id} asChild>
				<Button
					type="button"
					variant="filled"
					rightIcon={<ChevronDownIcon className="size-[13px]" />}
					className={widthClassName}
				>
					<SelectPrimitive.Value placeholder={placeholder} />
				</Button>
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
									className={clsx(
										"text-text outline-none cursor-pointer hover:bg-ghost-element-hover",
										"rounded-[4px] px-[8px] py-[6px] text-[14px]",
										"flex items-center justify-between gap-[4px]",
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
