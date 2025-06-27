/**
 * Panel spacing constants for consistent padding and margins across all property panels
 */

export const PANEL_SPACING = {
	// Header spacing
	HEADER: {
		HEIGHT: "48px",
		PADDING_LEFT: "pl-1", // 4px
		PADDING_TOP: "pt-2", // 8px (sidemenu only)
		ICON_SIZE: "28px",
		ICON_GAP: "gap-[8px]",
	},

	// Content spacing
	CONTENT: {
		GAP: "gap-[8px]", // Between root elements
	},

	// Generation panel spacing
	GENERATION: {
		HEADER_PADDING_Y: "py-[12px]",
		CONTENT_PADDING_TOP: "pt-[16px]",
		CONTENT_PADDING_BOTTOM: "pb-[12px]",
	},

	// Common layout classes
	LAYOUT: {
		FULL_HEIGHT: "h-full",
		FULL_WIDTH: "w-full",
		FLEX_COL: "flex flex-col",
		SHRINK_0: "shrink-0",
		OVERFLOW_HIDDEN: "overflow-hidden",
		FLEX_1: "flex-1",
	},
} as const;

/**
 * Get header classes based on sidemenu flag
 */
export function getHeaderClasses(sidemenu: boolean): string {
	const baseClasses = [
		PANEL_SPACING.HEADER.HEIGHT,
		"flex justify-between items-center",
		PANEL_SPACING.HEADER.PADDING_LEFT,
		PANEL_SPACING.LAYOUT.SHRINK_0,
	];

	if (sidemenu) {
		baseClasses.push(PANEL_SPACING.HEADER.PADDING_TOP);
	}

	return baseClasses.join(" ");
}

/**
 * Get content classes based on sidemenu flag
 */
export function getContentClasses(sidemenu: boolean): string {
	return [
		PANEL_SPACING.LAYOUT.FLEX_1,
		PANEL_SPACING.LAYOUT.FULL_HEIGHT,
		PANEL_SPACING.LAYOUT.FLEX_COL,
		PANEL_SPACING.LAYOUT.OVERFLOW_HIDDEN,
	].join(" ");
}

/**
 * Get generation panel header classes
 */
export function getGenerationHeaderClasses(): string {
	return [
		"border-b border-white-400/20",
		PANEL_SPACING.GENERATION.HEADER_PADDING_Y,
		"flex items-center",
		PANEL_SPACING.HEADER.ICON_GAP,
		"**:data-header-text:font-[700]",
	].join(" ");
}

/**
 * Get generation panel content classes
 */
export function getGenerationContentClasses(): string {
	return [
		PANEL_SPACING.GENERATION.CONTENT_PADDING_TOP,
		PANEL_SPACING.GENERATION.CONTENT_PADDING_BOTTOM,
		PANEL_SPACING.LAYOUT.FULL_HEIGHT,
		PANEL_SPACING.LAYOUT.OVERFLOW_HIDDEN,
	].join(" ");
}
