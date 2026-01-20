import clsx from "clsx/lite";
import type { FC, SVGProps } from "react";

export const DataQueryIcon: FC<SVGProps<SVGSVGElement>> = ({
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
		{/* Database with search/query icon */}
		<ellipse cx="9" cy="5" rx="7" ry="2.5" />
		<path d="M2 5v10c0 1.38 3.13 2.5 7 2.5" />
		<path d="M2 10c0 1.38 3.13 2.5 7 2.5" />
		<path d="M16 5v2" />
		{/* Search/magnifying glass */}
		<circle cx="17" cy="17" r="3" />
		<path d="m21 21-1.5-1.5" />
	</svg>
);
