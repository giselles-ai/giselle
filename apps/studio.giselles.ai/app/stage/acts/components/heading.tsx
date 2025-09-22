"use client";

/**
 * Acts-only Heading component.
 *
 * Goals:
 * - Zero visual diff when replacing the current inline <h1> used in Acts pages
 * - Use design tokens for color and currentColor-based glow
 * - Minimal API, no external dependencies
 *
 * Default styling matches:
 *   className="text-[30px] font-sans font-medium text-[var(--color-text-accent)] mb-2"
 *   style={{ textShadow: "0 0 20px color-mix(...), 0 0 40px color-mix(...), 0 0 60px color-mix(...)" }}
 */
import type * as React from "react";

type HeadingTag = "h1" | "h2" | "h3" | "div";

export interface HeadingProps
	extends Omit<React.HTMLAttributes<HTMLHeadingElement>, "color"> {
	/**
	 * Underlying tag. h1 by default.
	 */
	as?: HeadingTag;
	/**
	 * Enable glow based on currentColor. true by default.
	 */
	glow?: boolean;
	/**
	 * Override default color class. By default uses `text-[var(--color-text-accent)]`.
	 * Example: "text-text" or "text-[var(--color-text-80)]"
	 */
	colorClassName?: string;
}

/**
 * Minimal, tokenized heading for Acts pages.
 */
export function Heading(props: HeadingProps) {
	const {
		as = "h1",
		glow = true,
		className,
		colorClassName,
		style,
		children,
		...rest
	} = props;

	const Component = as as unknown as React.ElementType;

	// Default classes chosen to match the current Acts heading visuals
	const baseClasses =
		"text-[30px] font-sans font-medium mb-2 " +
		(colorClassName ?? "text-[var(--color-text-accent)]");

	const mergedClassName = [baseClasses, className].filter(Boolean).join(" ");

	// currentColor-based glow using color-mix; preserves look while staying token-friendly
	const glowShadow = [
		"0 0 20px color-mix(in srgb, currentColor, transparent 80%)",
		"0 0 40px color-mix(in srgb, currentColor, transparent 90%)",
		"0 0 60px color-mix(in srgb, currentColor, transparent 95%)",
	].join(", ");

	const mergedStyle: React.CSSProperties = {
		...(glow ? { textShadow: glowShadow } : null),
		...style,
	};

	return (
		<Component
			data-acts-heading
			className={mergedClassName}
			style={mergedStyle}
			{...rest}
		>
			{children}
		</Component>
	);
}

export default Heading;
