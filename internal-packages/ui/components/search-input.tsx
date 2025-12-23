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
		<div className="flex items-center gap-2 rounded-[8px] bg-white/5 px-3 h-10 text-[13px] text-text border border-border transition-all duration-150 w-full">
			<input
				className={clsx(
					"flex-1 bg-transparent text-[13px] text-text placeholder:text-link-muted outline-none border-none",
					className,
				)}
				{...props}
			/>
			<Search
				className={clsx("h-4 w-4 text-text-muted shrink-0", iconClassName)}
			/>
		</div>
	);
}
