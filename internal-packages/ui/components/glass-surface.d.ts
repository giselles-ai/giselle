import type { ReactNode } from "react";
type BorderStyle = "solid" | "gradient" | "destructive" | "none";
type Tone = "default" | "inverse" | "light";
type BorderTone = "default" | "destructive" | "muted";
type Variant = "default" | "info" | "destructive";
export type GlassSurfaceLayersProps = {
	variant?: Variant;
	tone?: Tone;
	radiusClass?: string;
	baseFillClass?: string;
	blurClass?: string;
	withBaseFill?: boolean;
	withTopHighlight?: boolean;
	borderStyle?: BorderStyle;
	borderTone?: BorderTone;
	zIndexClass?: string;
	className?: string;
	children?: ReactNode;
};
/**
 * Absolute-positioned glass layers: base fill + blur + (optional) top highlight + border.
 * Place inside a relatively positioned, rounded container.
 */
export declare function GlassSurfaceLayers({
	variant,
	tone,
	radiusClass,
	baseFillClass, // prefer token-driven mix; allow override via class
	blurClass,
	withBaseFill,
	withTopHighlight,
	borderStyle,
	borderTone,
	zIndexClass,
	className,
	children,
}: GlassSurfaceLayersProps): import("react/jsx-runtime").JSX.Element;
export type GlassOverlayProps = {
	tone?: Tone;
	baseFillClass?: string;
	blurClass?: string;
	className?: string;
};
export declare function GlassOverlay({
	tone,
	baseFillClass,
	blurClass,
	className,
}: GlassOverlayProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=glass-surface.d.ts.map
