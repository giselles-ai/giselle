import clsx from "clsx/lite";
import type { SVGProps } from "react";

export function Flux1Icon({ className, ...props }: SVGProps<SVGSVGElement>) {
	return (
		<svg
			viewBox="0 0 32 32"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			role="graphics-symbol"
			className={clsx("fill-current", className)}
			{...props}
		>
			<path
				d="M12 30H9v-2h3V15.566l-3.515-2.109l1.03-1.714l3.514 2.108A2.011 2.011 0 0 1 14 15.566V28a2.002 2.002 0 0 1-2 2Z"
				fill="currentColor"
			/>
			<path
				d="M22 30h-3a2.002 2.002 0 0 1-2-2V17h6a4 4 0 0 0 3.981-4.396A4.149 4.149 0 0 0 22.785 9h-1.583l-.177-.779C20.452 5.696 18.031 4 15 4a6.02 6.02 0 0 0-5.441 3.486l-.309.667l-.863-.114A2.771 2.771 0 0 0 8 8a4 4 0 1 0 0 8v2A6 6 0 1 1 8 6l.079.001A8.027 8.027 0 0 1 15 2c3.679 0 6.692 1.978 7.752 5h.033a6.164 6.164 0 0 1 6.187 5.414A6.001 6.001 0 0 1 23 19h-4v9h3Z"
				fill="currentColor"
			/>
		</svg>
	);
}
