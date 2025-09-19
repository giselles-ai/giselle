"use client";

import { Button } from "@giselle-internal/ui/button";
import type React from "react";

type GlassButtonProps = React.ComponentPropsWithoutRef<typeof Button>;

/**
 * GlassButton
 * Thin wrapper around internal Button using the tokenized "glass" variant.
 * - No inline styles
 * - Inherits all props from internal Button (including size, asChild, className)
 * - Keeps existing call sites unchanged while aligning visuals with design tokens
 */
export function GlassButton({ children, ...props }: GlassButtonProps) {
	return (
		<Button variant="glass" {...props}>
			{children}
		</Button>
	);
}
