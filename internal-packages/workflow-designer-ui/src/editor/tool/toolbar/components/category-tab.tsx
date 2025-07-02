import clsx from "clsx/lite";
import type { ReactNode } from "react";

export function CategoryTab({
	isActive,
	children,
	onClick,
}: {
	isActive: boolean;
	children: ReactNode;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={clsx(
				"flex px-[8px] py-[6px] justify-center items-center gap-[10px] rounded-[4px] text-[14px] font-medium",
				isActive
					? "bg-primary-700 text-white-100"
					: "bg-black-800/50 text-white-300 hover:bg-black-800/80 hover:text-white-100",
			)}
		>
			{children}
		</button>
	);
}
