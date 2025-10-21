import clsx from "clsx/lite";
import { jsx as _jsx } from "react/jsx-runtime";
export function PageHeading({
	as = "h1",
	glow = false,
	glowColor = "#0087f6",
	className,
	style,
	children,
	...props
}) {
	const Comp = as;
	const glowStyle = glow
		? {
				textShadow: `0 0 20px ${glowColor}, 0 0 40px ${glowColor}, 0 0 60px ${glowColor}`,
			}
		: undefined;
	return _jsx(Comp, {
		className: clsx(
			// default visual consistent with /apps heading
			"text-[30px] font-sans font-medium text-[hsl(192,73%,84%)]",
			className,
		),
		style: { ...glowStyle, ...style },
		...props,
		children: children,
	});
}
//# sourceMappingURL=page-heading.js.map
