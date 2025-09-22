"use client";

/**
 * Shared Heading component for studio apps.
 *
 * Defaults to the stage/showcase heading design:
 * - size: text-[30px]
 * - weight: font-sans font-medium
 * - color: text-text (standard text color)
 * - glow: disabled by default
 *
 * Customization guidelines:
 * - Prefer utility classes over raw CSS variables, e.g.:
 *   - text-text instead of text-[var(--color-text)]
 *   - text-text-muted instead of text-[var(--color-text-muted)]
 *   - If --color-mint-500 is defined in CSS, you can use bg-mint-500 / text-mint-500 utilities
 *
 * Glow options:
 * - Set glow to true to enable a text glow effect
 * - Set currentColorGlow to true to derive glow color from currentColor (token-friendly)
 * - Otherwise, glow uses a fixed color from `glowColor` (default: #0087f6)
 */

import * as React from "react";

type HeadingTag = "h1" | "h2" | "h3" | "div";

export interface HeadingProps
  extends Omit<React.HTMLAttributes<HTMLHeadingElement>, "color"> {
  /**
   * Underlying tag. h1 by default.
   */
  as?: HeadingTag;
  /**
   * Enable glow shadow. Disabled by default.
   */
  glow?: boolean;
  /**
   * Use currentColor-based glow (token-friendly). When true, ignores `glowColor`.
   * Disabled by default.
   */
  currentColorGlow?: boolean;
  /**
   * Fixed glow color (used when `currentColorGlow` is false and `glow` is true).
   * Defaults to "#0087f6".
   */
  glowColor?: string;
  /**
   * Override main color class. Defaults to "text-text".
   */
  colorClassName?: string;
  /**
   * Override size class. Defaults to "text-[30px]".
   */
  sizeClassName?: string;
  /**
   * Override weight/face classes. Defaults to "font-sans font-medium".
   */
  weightClassName?: string;
}

/**
 * Token-aware, minimal Heading component.
 * - Default: stage/showcase look (text-text, no glow)
 * - Acts or other pages can opt into tokenized/currentColor glow via props
 */
export function Heading(props: HeadingProps) {
  const {
    as = "h1",
    glow = false,
    currentColorGlow = false,
    glowColor = "#0087f6",
    colorClassName = "text-text",
    sizeClassName = "text-[30px]",
    weightClassName = "font-sans font-medium",
    className,
    style,
    children,
    ...rest
  } = props;

  const Component = as as unknown as React.ElementType;

  const mergedClassName = [
    sizeClassName,
    weightClassName,
    colorClassName,
    "mb-2",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const textShadow = (() => {
    if (!glow) return undefined;
    if (currentColorGlow) {
      return [
        "0 0 20px color-mix(in srgb, currentColor, transparent 80%)",
        "0 0 40px color-mix(in srgb, currentColor, transparent 90%)",
        "0 0 60px color-mix(in srgb, currentColor, transparent 95%)",
      ].join(", ");
    }
    return `0 0 20px ${glowColor}, 0 0 40px ${glowColor}, 0 0 60px ${glowColor}`;
  })();

  const mergedStyle: React.CSSProperties = {
    ...(textShadow ? { textShadow } : null),
    ...style,
  };

  return (
    <Component className={mergedClassName} style={mergedStyle} {...rest}>
      {children}
    </Component>
  );
}

export default Heading;
