import clsx from "clsx/lite";

type AccentLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
	underline?: boolean;
};

export function AccentLink({
	underline = false,
	className,
	...props
}: AccentLinkProps) {
	return (
		<a
			{...props}
			className={clsx(
				"text-[#1663F3] hover:text-[#0f4cd1]",
				underline && "hover:underline",
				"transition-colors duration-200",
				className,
			)}
		/>
	);
}
