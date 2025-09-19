import clsx from "clsx/lite";

import * as React from "react";

/**
 * IconAction
 * A tiny helper for consistent icon-button hover styles across Stage.
 *
 * Default behavior follows the sidebar's expand/collapse icons:
 * - default: text-white/60
 * - hover: text-white/80
 *
 * Optionally supports:
 * - "box" (border + bg on hover) used in Showcase
 * - "fill" (bg on hover, no border) — square with 8px rounding to match sidebar cards
 */
type IconActionVariant = "flat" | "box" | "fill" | "fill-subtle";
type IconActionSize = "sm" | "md" | "lg";
type IconActionIconSize = "xs" | "sm" | "md" | "lg";
type IconActionRounded = "full" | "md" | "none";

interface IconActionProps
	extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
	children: React.ReactNode;
	variant?: IconActionVariant;
	size?: IconActionSize;
	rounded?: IconActionRounded;
	iconSize?: IconActionIconSize;
}

const base =
	"inline-flex items-center justify-center transition-colors focus:outline-none";

/**
 * Spacing around the icon:
 * - sm: p-1 (8px hit area min)
 * - md: p-1.5
 * - lg: p-2
 */
const sizeMap: Record<IconActionSize, string> = {
	sm: "p-1",
	md: "p-1.5",
	lg: "p-2",
};

/**
 * Rounding map:
 * - md: rounded-[8px] to match sidebar card corners
 * - full / none are available for special cases
 */
const roundedMap: Record<IconActionRounded, string> = {
	full: "rounded-full",
	md: "rounded-[8px]",
	none: "rounded-none",
};

const iconSizeMap: Record<IconActionIconSize, string> = {
	xs: "w-3 h-3",
	sm: "w-4 h-4",
	md: "w-5 h-5",
	lg: "w-6 h-6",
};

// Sidebar-style (flat): color only
const flatVariant = "text-text-muted hover:text-text";

// Showcase-style (box): border + bg + color
const boxVariant =
	"text-text-muted border border-border hover:border-border-strong hover:bg-ghost-element-hover hover:text-text";

// Fill-style (no border): subtle background fill on hover (square by default)
const fillVariant =
	"text-text-muted hover:text-text hover:bg-ghost-element-hover";

const fillSubtleVariant =
	"text-text-muted hover:text-text hover:bg-ghost-element-hover-subtle";

/**
 * Shared icon action button.
 *
 * Usage examples:
 * - Sidebar-equivalent (color-only hover):
 *   <IconAction title=\"Archive\" onClick={...}><Archive className=\"w-4 h-4\" /></IconAction>
 *
 * - Subtle square fill on hover (sidebar-like emphasis without border):
 *   <IconAction variant=\"fill\" rounded=\"md\" title=\"Toggle\"><ChevronDownIcon className=\"w-4 h-4\" /></IconAction>
 *
 * - Showcase-equivalent (boxy hover):
 *   <IconAction variant=\"box\" title=\"Run\"><Play className=\"w-3 h-3\" /></IconAction>
 */
export function IconAction({
	children,
	className,
	variant = "flat",
	size = "md",
	rounded = "md",
	type = "button",
	iconSize,
	...props
}: IconActionProps) {
	const variantClass =
		variant === "box"
			? boxVariant
			: variant === "fill"
				? fillVariant
				: variant === "fill-subtle"
					? fillSubtleVariant
					: flatVariant;

	// Auto-apply icon size to the single child icon if provided and the icon
	// doesn't already have explicit w-/h- classes.
	let sizedChild = children;
	if (React.isValidElement(children) && iconSize) {
		const childClass =
			(children.props as { className?: string })?.className ?? "";
		const hasWidth = /\bw-\d+/.test(childClass);
		const hasHeight = /\bh-\d+/.test(childClass);
		const sizeClass = iconSizeMap[iconSize];
		if (sizeClass && !(hasWidth && hasHeight)) {
			sizedChild = React.cloneElement(
				children as React.ReactElement<{ className?: string }>,
				{ className: clsx(childClass, sizeClass) },
			);
		}
	}

	return (
		<button
			type={type}
			className={clsx(
				base,
				sizeMap[size],
				roundedMap[rounded],
				variantClass,
				className,
			)}
			{...props}
		>
			{sizedChild}
		</button>
	);
}
