"use client";

import clsx from "clsx/lite";
import { TrashIcon } from "lucide-react";
import type { ReactNode } from "react";
import { COMMON_STYLES } from "./common-styles";

interface ConnectionListItemProps {
	icon: ReactNode;
	title: string;
	subtitle: string;
	onRemove: () => void;
	className?: string;
}

export function ConnectionListItem({
	icon,
	title,
	subtitle,
	onRemove,
	className,
}: ConnectionListItemProps) {
	return (
		<div
			className={clsx(
				"group flex items-center",
				"border border-white-900/20 rounded-[8px] h-[60px]",
				className,
			)}
		>
			<div className={COMMON_STYLES.iconContainer}>{icon}</div>
			<div className="w-[1px] h-full border-l border-white-900/20" />
			<div className="px-[16px] flex-1 flex items-center justify-between">
				<div className="flex flex-col gap-[4px]">
					<p className="text-[16px]">{title}</p>
					<div className="text-[10px] text-black-400">
						<p className="line-clamp-1">{subtitle}</p>
					</div>
				</div>
				<button
					type="button"
					className={clsx(
						"hidden group-hover:block",
						"p-[4px] rounded-[4px]",
						"bg-transparent hover:bg-black-300/50 transition-colors",
					)}
					onClick={onRemove}
				>
					<TrashIcon className="w-[18px] h-[18px] text-white-900" />
				</button>
			</div>
		</div>
	);
} 