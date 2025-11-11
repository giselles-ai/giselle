import clsx from "clsx/lite";
import type { NavigationRailState } from "./types";

export function NavigationRailContainer({
	children,
	variant,
}: React.PropsWithChildren<{ variant: NavigationRailState }>) {
	return (
		<div
			className={clsx(
				"relative h-full flex-col transition-all duration-300",
				variant === "collapsed" && "w-navigation-rail-collapsed",
				variant === "expanded" && "w-navigation-rail-expanded",
			)}
		>
			<div
				className={clsx(
					"px-4",
					variant === "collapsed" && "w-navigation-rail-collapsed",
					variant === "expanded" && "w-navigation-rail-expanded",
				)}
			>
				{children}
			</div>
		</div>
	);
}
