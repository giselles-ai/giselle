import clsx from "clsx/lite";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";
import { Button } from "./button";
import { PopoverContent } from "./popover";

type Identifiable = {
	id: string;
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
}: SelectProps<T>) {
	return (
		<SelectPrimitive.Root
			value={value}
			onValueChange={onValueChange}
			defaultValue={defaultValue}
			name={name}
		>
			<SelectPrimitive.Trigger asChild>
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
					className={clsx("w-(--radix-select-trigger-width) z-50")}
				>
					<PopoverContent>
						<SelectPrimitive.Viewport>
							{options.map((option) => (
								<SelectPrimitive.Item
									key={option.id}
									value={option.id}
									className={clsx(
										"text-text outline-none cursor-pointer hover:bg-ghost-element-hover",
										"rounded-[2px] px-[6px] py-[2px] text-[14px]",
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
