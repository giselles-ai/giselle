import clsx from "clsx/lite";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
	return (
		<input
			className={clsx(
				"border border-border rounded-[4px] bg-editor-background outline-none px-[8px] py-[2px] text-[14px] text-text",
				"focus:border-border-focused",
				className,
			)}
			{...props}
		/>
	);
}
