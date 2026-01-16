import clsx from "clsx/lite";
import type { FC, SVGProps } from "react";

export const DataStoreIcon: FC<SVGProps<SVGSVGElement>> = ({
	className,
	...props
}) => (
	<svg
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		role="graphics-symbol"
		className={clsx(
			"stroke-current",
			"fill-transparent",
			"[stroke-width:2]",
			"[stroke-linecap:round]",
			"[stroke-linejoin:round]",
			className,
		)}
		{...props}
	>
		{/* Database cylinder icon */}
		<ellipse cx="12" cy="5" rx="9" ry="3" />
		<path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
		<path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
	</svg>
);
