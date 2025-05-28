import clsx from "clsx/lite";
import { TrashIcon } from "lucide-react";
import type { ReactNode } from "react";

export function ConnectionListRoot({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) {
	return (
		<div className="flex flex-col gap-[8px]">
			<p className="text-[14px]">{title}</p>
			{children}
		</div>
	);
}

export function ConnectionListItem({
	icon,
	title,
	subtitle,
	onRemove,
}: {
	icon: ReactNode;
	title: string;
	subtitle: string;
	onRemove: () => void;
}) {
	return (
		<div
			className={clsx(
				"group flex items-center",
				"border border-white-900/20 rounded-[8px] h-[60px]",
			)}
		>
			<div className="w-[60px] flex items-center justify-center">{icon}</div>
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
