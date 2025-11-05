import clsx from "clsx/lite";
import type { ReactNode } from "react";

type BorderStyle = "solid" | "gradient" | "destructive" | "none";

type Tone = "default" | "inverse" | "light";
type BorderTone = "default" | "destructive" | "muted";

type Variant = "default" | "info" | "destructive";

export type GlassSurfaceLayersProps = {
	variant?: Variant;
	tone?: Tone; // semantic background tone; overrides baseFillClass when provided
	radiusClass?: string;
	baseFillClass?: string; // e.g. "bg-black-900/50"
	blurClass?: string; // e.g. "backdrop-blur-md"
	withBaseFill?: boolean;
	withTopHighlight?: boolean;
	borderStyle?: BorderStyle;
	borderTone?: BorderTone; // solid border tone; overrides default class when provided
	withAuxHairline?: boolean; // add a subtle extra hairline for contrast
	zIndexClass?: string; // e.g. "-z-10"
	className?: string;
	children?: ReactNode; // optional: allow nesting extra layers
};

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
	withAuxHairline = true,
	zIndexClass = "-z-10",
	className,
	children,
}: GlassSurfaceLayersProps) {
	const variantToTone: Record<Variant, Tone> = {
		default: "default",
		info: "default",
		destructive: "light",
	};
	const variantToBorderTone: Record<Variant, BorderTone> = {
		default: "muted",
		info: "muted",
		destructive: "destructive",
	};
	const toneToBaseFillClass: Record<Tone, string> = {
		default: "",
		inverse: "",
		light: "",
	};

	const appliedTone = tone ?? variantToTone[variant];
	const appliedBorderTone = borderTone ?? variantToBorderTone[variant];
	const resolvedBaseFillClass =
		baseFillClass || toneToBaseFillClass[appliedTone] || "";

	const borderToneToClass: Record<BorderTone, string> = {
		default: "border-border",
		destructive: "border-error-900",
		muted: "border-border-muted",
	};

	const solidBorderClass = clsx(
		"border-[0.5px]",
		borderToneToClass[appliedBorderTone],
	);

	return (
		<div
			className={clsx(
				"absolute inset-0 pointer-events-none",
				radiusClass,
				zIndexClass,
				className,
			)}
			aria-hidden
		>
			{withBaseFill && (
				<div
					className={clsx(
						"absolute inset-0",
						zIndexClass,
						radiusClass,
						resolvedBaseFillClass,
					)}
					style={
						resolvedBaseFillClass
							? undefined
							: {
									background:
										"color-mix(in srgb, var(--color-background) 50%, transparent)",
								}
					}
				/>
			)}
			<div
				className={clsx(
					"absolute inset-0",
					zIndexClass,
					radiusClass,
					blurClass,
				)}
			/>
			{withTopHighlight && (
				<div
					className={clsx("absolute top-0 left-4 right-4 h-px", zIndexClass)}
					style={{ backgroundImage: "var(--glass-highlight-bg)" }}
				/>
			)}
			{borderStyle === "destructive" ? (
				<div
					className={clsx(
						"absolute inset-0",
						zIndexClass,
						radiusClass,
						"border-[0.5px] border-error-900",
					)}
				/>
			) : borderStyle === "solid" ? (
				<div
					className={clsx(
						"absolute inset-0",
						zIndexClass,
						radiusClass,
						solidBorderClass,
					)}
				/>
			) : borderStyle === "gradient" ? (
				<div className={clsx("absolute inset-0", zIndexClass, radiusClass)}>
					<div className="absolute inset-0 rounded-[inherit] p-px">
						<div
							className="h-full w-full rounded-[inherit]"
							style={{ background: "var(--glass-stroke-gradient)" }}
						/>
					</div>
				</div>
			) : null}
			{borderStyle === "solid" && withAuxHairline && (
				<div
					className={clsx(
						"absolute inset-0",
						zIndexClass,
						radiusClass,
						"border-[0.5px] border-border opacity-20",
					)}
					aria-hidden
				/>
			)}
			{children}
		</div>
	);
}

export type GlassOverlayProps = {
	tone?: Tone;
	baseFillClass?: string;
	blurClass?: string;
	className?: string;
};

// Overlay for dialogs/menus with tokenized background + blur
export function GlassOverlay({
	tone = "default",
	baseFillClass,
	blurClass = "backdrop-blur-md",
	className,
}: GlassOverlayProps) {
	const toneToBaseFillClass: Record<Tone, string> = {
		default: "bg-black-900/50",
		inverse: "bg-black-900/50",
		light: "bg-white/5",
	};
	const resolved = baseFillClass ?? toneToBaseFillClass[tone];
	return (
		<div className={clsx("fixed inset-0", resolved, blurClass, className)} />
	);
}
