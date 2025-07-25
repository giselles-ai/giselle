import clsx from "clsx/lite";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";
import { PopoverContent } from "./popover";

type Identifiable = {
	id: string | number;
};

interface SelectProps<T extends Identifiable> {
	options: Array<T>;
	renderOption: (option: T) => React.ReactNode;
	placeholder: string;
	value?: string;
	onValueChange?: (value: string) => void;
	defaultValue?: string;
	widthClassName?: string;
	name?: string;
	id?: string;
	renderValue?: (options: T) => string | number;
}

export function Select<T extends Identifiable>({
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
				<button
					type="button"
					className={clsx(
						"w-full flex justify-between items-center rounded-[8px] py-[8px] px-[12px] border border-white-900 text-left text-[14px]",
						"outline-none focus:outline-none",
						"transition-colors hover:bg-ghost-element-hover",
						"data-[placeholder]:text-text-muted",
						widthClassName,
					)}
				>
					<SelectPrimitive.Value placeholder={placeholder} />
					<ChevronDownIcon className="size-[13px] shrink-0 text-text" />
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
									key={option.id}
									value={
										renderValue ? `${renderValue(option)}` : `${option.id}`
									}
									className={clsx(
										"text-text outline-none cursor-pointer hover:bg-ghost-element-hover",
										"rounded-[4px] px-[8px] py-[6px] text-[14px]",
										"flex items-center justify-between gap-[4px]",
									)}
								>
									<SelectPrimitive.ItemText>
										{renderOption(option)}
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
