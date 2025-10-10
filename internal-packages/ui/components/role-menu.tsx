import clsx from "clsx/lite";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { Popover, PopoverContent } from "./popover";

export type RoleMenuOption = {
	value: string;
	label: string;
};

export interface RoleMenuProps {
	value: string;
	options: RoleMenuOption[];
	onChange?: (value: string) => void;
	canEdit?: boolean;
	canRemove?: boolean;
	onRemove?: () => void;
	className?: string;
	widthClassName?: string;
	triggerClassName?: string;
}

export function RoleMenu({
	value,
	options,
	onChange,
	canEdit = false,
	canRemove = false,
	onRemove,
	className,
	widthClassName,
	triggerClassName,
}: RoleMenuProps) {
	return (
		<Popover
			trigger={
				<button
					type="button"
					className={clsx(
						"w-full flex justify-between items-center rounded-[8px] h-8 px-[12px] text-left text-[14px]",
						"outline-none focus:outline-none focus-visible:outline-none focus:ring-0",
						"bg-inverse/5 transition-colors hover:bg-inverse/10",
						widthClassName,
						triggerClassName,
					)}
				>
					<div className="flex-1 min-w-0 text-ellipsis overflow-hidden whitespace-nowrap capitalize">
						{options.find((o) => o.value === value)?.label ?? value}
					</div>
					<ChevronDownIcon className="size-[13px] shrink-0 text-text ml-2" />
				</button>
			}
		>
			<PopoverContent>
				<div className={clsx("min-w-[165px] p-1", className)}>
					{options.map((opt) => (
						<button
							key={opt.value}
							type="button"
							disabled={!canEdit}
							onClick={() => canEdit && onChange?.(opt.value)}
							className={clsx(
								"text-text outline-none cursor-pointer hover:bg-ghost-element-hover",
								"rounded-[4px] px-[8px] py-[6px] text-[14px] w-full text-left capitalize",
								!canEdit && "opacity-50 cursor-not-allowed pointer-events-none",
								"flex items-center gap-2",
							)}
						>
							<span className="inline-flex justify-center items-center w-4 h-4 mr-2">
								{value === opt.value && <CheckIcon className="size-[13px]" />}
							</span>
							{opt.label}
						</button>
					))}

					{canRemove && (
						<>
							<div className="my-2 h-px bg-inverse/10" />
							<button
								type="button"
								onClick={onRemove}
								className={clsx(
									"w-full text-left rounded-md px-3 py-2 font-medium text-[14px]",
									"text-error-900 hover:bg-error-900/20",
								)}
							>
								Remove
							</button>
						</>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
