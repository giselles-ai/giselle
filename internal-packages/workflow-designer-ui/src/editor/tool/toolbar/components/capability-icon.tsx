import type { ReactNode } from "react";

export function CapabilityIcon({
	children,
	icon,
}: {
	children: ReactNode;
	icon?: ReactNode;
}) {
	return (
		<span className="flex gap-[4px] rounded-[20px] border-[1px] border-white-800 px-[8px] py-[2px] text-[12px]">
			{icon && (
				<span className="flex items-center scale-90 text-white-950">
					{icon}
				</span>
			)}
			{children}
		</span>
	);
}
