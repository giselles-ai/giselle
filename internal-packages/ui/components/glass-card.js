import clsx from "clsx/lite";
import { jsx as _jsx } from "react/jsx-runtime";
export function GlassCard({ className, paddingClassName, ...props }) {
	return _jsx("div", {
		className: clsx(
			"relative rounded-[12px] overflow-hidden w-full",
			"bg-white/[0.02] backdrop-blur-[8px] border-[0.5px] border-border",
			"shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(255,255,255,0.2)]",
			"before:content-[''] before:absolute before:inset-0 before:bg-white before:opacity-[0.02] before:rounded-[inherit] before:pointer-events-none",
			"hover:border-border transition-colors duration-200",
			paddingClassName,
			className,
		),
		...props,
	});
}
//# sourceMappingURL=glass-card.js.map
