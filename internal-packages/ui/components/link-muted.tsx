import clsx from "clsx/lite";
import { Slot } from "radix-ui";

interface LinkMutedProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
	asChild?: boolean;
}

export function LinkMuted({
	className,
	asChild = false,
	...props
}: LinkMutedProps) {
	const Comp = asChild ? Slot.Root : "a";
	return (
		<Comp
			className={clsx(
				// muted link color with hover recovery to normal link color
				"text-link-muted hover:underline hover:text-text",
				"transition-colors",
				className,
			)}
			{...props}
		/>
	);
}
