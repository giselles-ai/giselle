import clsx from "clsx/lite";
import type { FC, SVGProps } from "react";

export const SpinnerIcon: FC<SVGProps<SVGSVGElement>> = ({
	className,
	...props
}) => (
	<svg
		width="20"
		height="20"
		viewBox="0 0 20 20"
		xmlns="http://www.w3.org/2000/svg"
		className={clsx("stroke-current fill-transparent", className)}
		role="graphics-symbol"
		{...props}
	>
		<circle
			cx="10"
			cy="10"
			r="9"
			transform="rotate(-180 10 10)"
			strokeWidth="2"
			strokeMiterlimit="2.9238"
			strokeLinecap="round"
			strokeDasharray="6 8"
		/>
	</svg>
);
