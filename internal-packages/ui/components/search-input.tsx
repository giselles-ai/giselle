import clsx from "clsx/lite";
import { Search } from "lucide-react";

export type SearchInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
	iconClassName?: string;
};

export function SearchInput({
	className,
	iconClassName,
	...props
}: SearchInputProps) {
	return (
		<div className="flex items-center gap-2 rounded-[8px] bg-white/5 px-3 py-2 text-[13px] text-text shadow-[0_0_0_1px_rgba(255,255,255,0.12)] transition-all duration-150 w-full">
			<input
				className={clsx(
					"flex-1 bg-transparent text-[13px] text-text placeholder:text-link-muted outline-none border-none",
					className,
				)}
				{...props}
			/>
			<Search
				className={clsx(
					"h-4 w-4 text-text-muted shrink-0",
					iconClassName,
				)}
			/>
		</div>
	);
}
