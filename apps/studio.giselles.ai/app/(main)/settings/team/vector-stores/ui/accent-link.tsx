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
				"text-link-accent hover:text-link-accent",
				underline && "hover:underline",
				"transition-colors duration-200",
				className,
			)}
		/>
	);
}
