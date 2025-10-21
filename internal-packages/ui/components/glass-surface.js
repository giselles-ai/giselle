import clsx from "clsx/lite";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Absolute-positioned glass layers: base fill + blur + (optional) top highlight + border.
 * Place inside a relatively positioned, rounded container.
 */
export function GlassSurfaceLayers({
	variant = "default",
	tone,
	radiusClass = "rounded-[12px]",
	baseFillClass = "", // prefer token-driven mix; allow override via class
	blurClass = "backdrop-blur-md",
	withBaseFill = true,
	withTopHighlight = true,
	borderStyle = "solid",
	borderTone = "default",
	zIndexClass = "-z-10",
	className,
	children,
}) {
	const variantToTone = {
		default: "default",
		info: "default",
		destructive: "light",
	};
	const variantToBorderTone = {
		default: "default",
		info: "muted",
		destructive: "destructive",
	};
	const toneToBaseFillClass = {
		default: "",
		inverse: "",
		light: "",
	};
	const appliedTone =
		tone !== null && tone !== void 0 ? tone : variantToTone[variant];
	const appliedBorderTone =
		borderTone !== null && borderTone !== void 0
			? borderTone
			: variantToBorderTone[variant];
	const resolvedBaseFillClass =
		baseFillClass || toneToBaseFillClass[appliedTone] || "";
	const borderToneToClass = {
		default: "border-border",
		destructive: "border-error-900/15",
		muted: "border-border-muted",
	};
	const solidBorderClass = clsx(
		"border-[0.5px]",
		borderToneToClass[appliedBorderTone],
	);
	return _jsxs("div", {
		className: clsx(
			"absolute inset-0 pointer-events-none",
			radiusClass,
			zIndexClass,
			className,
		),
		"aria-hidden": true,
		children: [
			withBaseFill &&
				_jsx("div", {
					className: clsx(
						"absolute inset-0",
						zIndexClass,
						radiusClass,
						resolvedBaseFillClass,
					),
					style: resolvedBaseFillClass
						? undefined
						: {
								background:
									"color-mix(in srgb, var(--color-bg) 50%, transparent)",
							},
				}),
			_jsx("div", {
				className: clsx(
					"absolute inset-0",
					zIndexClass,
					radiusClass,
					blurClass,
				),
			}),
			withTopHighlight &&
				_jsx("div", {
					className: clsx("absolute top-0 left-4 right-4 h-px", zIndexClass),
					style: {
						backgroundImage:
							"linear-gradient(to right, transparent, color-mix(in srgb, var(--color-text) 40%, transparent), transparent)",
					},
				}),
			borderStyle === "destructive"
				? _jsx("div", {
						className: clsx(
							"absolute inset-0",
							zIndexClass,
							radiusClass,
							"border-[0.5px] border-error-900/15",
						),
					})
				: borderStyle === "solid"
					? _jsx("div", {
							className: clsx(
								"absolute inset-0",
								zIndexClass,
								radiusClass,
								solidBorderClass,
							),
						})
					: borderStyle === "gradient"
						? _jsx("div", {
								className: clsx("absolute inset-0", zIndexClass, radiusClass),
								children: _jsx("div", {
									className: "absolute inset-0 rounded-[inherit] p-px",
									children: _jsx("div", {
										className: "h-full w-full rounded-[inherit]",
										style: { background: "var(--glass-stroke-gradient)" },
									}),
								}),
							})
						: null,
			children,
		],
	});
}
// Overlay for dialogs/menus with tokenized background + blur
export function GlassOverlay({
	tone = "default",
	baseFillClass,
	blurClass = "backdrop-blur-md",
	className,
}) {
	const toneToBaseFillClass = {
		default: "bg-black-900/50",
		inverse: "bg-black-900/50",
		light: "bg-white/5",
	};
	const resolved =
		baseFillClass !== null && baseFillClass !== void 0
			? baseFillClass
			: toneToBaseFillClass[tone];
	return _jsx("div", {
		className: clsx("fixed inset-0", resolved, blurClass, className),
	});
}
//# sourceMappingURL=glass-surface.js.map
