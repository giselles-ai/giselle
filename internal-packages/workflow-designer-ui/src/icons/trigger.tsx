import clsx from "clsx/lite";
import type { SVGProps } from "react";

export function TriggerIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
	return (
		<svg
			width="6"
			height="10"
			viewBox="0 0 15 21"
			xmlns="http://www.w3.org/2000/svg"
			role="graphics-symbol"
			className={clsx("fill-current", className)}
			{...props}
		>
			<path d="M4.39934 0L11.4302 0.739924C11.8899 0.784098 12.1738 1.19271 11.971 1.53507L8.00942 8.6803C7.79308 9.07787 8.18519 9.53066 8.72602 9.48649L14.229 9.00057C14.8375 8.94535 15.2296 9.51962 14.851 9.91719L4.64272 20.7731C4.14245 21.3032 3.12838 20.8173 3.43936 20.2099L6.68437 13.8377C6.88718 13.4401 6.49508 13.0094 5.96777 13.0536L0.775753 13.5285C0.289001 13.5726 -0.0895829 13.2192 0.018584 12.8327L3.62866 0.441746C3.70978 0.154611 4.0478 -0.0331309 4.39934 0.0110436V0Z" />
		</svg>
	);
}
