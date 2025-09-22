import clsx from "clsx/lite";

export function MenuButton({
	onClick,
	children,
	className,
}: Pick<
	React.DetailedHTMLProps<
		React.ButtonHTMLAttributes<HTMLButtonElement>,
		HTMLButtonElement
	>,
	"onClick" | "children" | "className"
>) {
	return (
		<button
			type="button"
			className={clsx(
				"group size-8 text-stage-sidebar-text hover:text-stage-sidebar-text-hover transition-colors rounded flex items-center justify-center",
				className,
			)}
			onClick={onClick}
		>
			{children}
		</button>
	);
}
