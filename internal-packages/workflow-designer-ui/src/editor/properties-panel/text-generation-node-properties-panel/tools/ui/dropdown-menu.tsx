import clsx from "clsx/lite";
import { ChevronDownIcon } from "lucide-react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { Button } from "./button";
import { PopoverContent } from "./popover";

type Identifiable = {
	id: string;
};
interface DropdownMenuProps<T extends Identifiable> {
	items: Array<T>;
	renderItem: (item: T) => React.ReactNode;
	placeholder: string;
}
export function DropdownMenu<T extends Identifiable>({
	renderItem,
	items,
	placeholder,
}: DropdownMenuProps<T>) {
	return (
		<DropdownMenuPrimitive.Root>
			<DropdownMenuPrimitive.Trigger asChild>
				<Button
					type="button"
					variant="filled"
					rightIcon={<ChevronDownIcon className="size-[13px]" />}
				>
					{placeholder}
				</Button>
			</DropdownMenuPrimitive.Trigger>
			<DropdownMenuPrimitive.Portal>
				<DropdownMenuPrimitive.Content
					sideOffset={4}
					className={clsx("w-(--radix-dropdown-menu-trigger-width) z-50")}
				>
					<PopoverContent>
						{items.map((item) => (
							<DropdownMenuPrimitive.Item
								data-item
								key={item.id}
								className={clsx(
									"text-text outline-none cursor-pointer hover:bg-ghost-element-hover",
									"rounded-[2px] px-[8px] py-[2px] text-[14px]",
								)}
							>
								{renderItem(item)}
							</DropdownMenuPrimitive.Item>
						))}
					</PopoverContent>
				</DropdownMenuPrimitive.Content>
			</DropdownMenuPrimitive.Portal>
		</DropdownMenuPrimitive.Root>
	);
}
