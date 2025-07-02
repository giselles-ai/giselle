/**
 * Panel spacing constants for consistent padding and margins across all property panels
 */

export const PANEL_SPACING = {
	// Header spacing
	HEADER: {
		HEIGHT: "h-[48.5px]",
		HEIGHT_VALUE: 48.5, // For calculations or style objects
		PADDING: "pt-2 pr-0 pb-0 pl-1", // 8px 0 0 4px
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
 * Common header height utilities
 */
export const PANEL_HEADER = {
	HEIGHT_CLASS: PANEL_SPACING.HEADER.HEIGHT,
	HEIGHT_VALUE: PANEL_SPACING.HEADER.HEIGHT_VALUE,
	PADDING_CLASS: PANEL_SPACING.HEADER.PADDING,

	/**
	 * Get inline style for header height
	 */
	getHeightStyle: () => ({ height: `${PANEL_SPACING.HEADER.HEIGHT_VALUE}px` }),

	/**
	 * Get complete header classes
	 */
	getClasses: (sidemenu = false) => getHeaderClasses(sidemenu),
} as const;

/**
 * Get header classes based on sidemenu flag
 */
export function getHeaderClasses(_sidemenu: boolean): string {
	const baseClasses = [
		PANEL_SPACING.HEADER.HEIGHT,
		"flex justify-between items-center",
		PANEL_SPACING.HEADER.PADDING,
		PANEL_SPACING.LAYOUT.SHRINK_0,
	];

	return baseClasses.join(" ");
}

/**
 * Get content classes based on sidemenu flag
 */
export function getContentClasses(_sidemenu: boolean): string {
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
