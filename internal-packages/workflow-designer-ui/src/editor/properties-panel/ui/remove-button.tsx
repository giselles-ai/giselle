import { TrashIcon } from "lucide-react";
import { Tooltip, type TooltipProps } from "../../../ui/tooltip";

export function RemoveButton({
	onClick,
	className = "",
	...props
}: Omit<TooltipProps, "text" | "children"> & {
	onClick?: () => void;
	className?: string;
}) {
	return (
		<Tooltip text="Remove" {...props}>
			<button
				type="button"
				className={`hidden group-hover:block px-[4px] py-[4px] bg-transparent hover:bg-white-900/10 rounded-[8px] transition-colors flex-shrink-0 ${className}`}
				onClick={onClick}
			>
				<TrashIcon className="w-[24px] h-[24px] stroke-current stroke-[1px]" />
			</button>
		</Tooltip>
	);
}
