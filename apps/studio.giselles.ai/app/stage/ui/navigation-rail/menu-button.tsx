import clsx from "clsx/lite";

export function MenuButton({
	onClick,
	children,
	className,
	disabled,
	type = "button",
	...props
}: Pick<
	React.DetailedHTMLProps<
		React.ButtonHTMLAttributes<HTMLButtonElement>,
		HTMLButtonElement
	>,
	"onClick" | "children" | "className" | "disabled" | "aria-label" | "type"
>) {
	return (
		<button
			type={type}
			className={clsx(
				"group size-8 text-stage-sidebar-text hover:text-stage-sidebar-text-hover transition-colors rounded flex items-center justify-center",
				className,
			)}
			onClick={onClick}
			disabled={disabled}
			{...props}
		>
			{children}
		</button>
	);
}
