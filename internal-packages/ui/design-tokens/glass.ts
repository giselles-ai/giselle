export const glassTokens = {
	colors: {
		primary: "#6B8FF0",
		glass: {
			background:
				"linear-gradient(135deg, rgba(150, 150, 150, 0.03) 0%, rgba(60, 90, 160, 0.12) 100%)",
			border: "rgba(255, 255, 255, 0.1)",
			topHighlight: "rgba(255, 255, 255, 0.4)",
		},
		button: {
			glassBase: {
				background: "linear-gradient(180deg, #202530 0%, #12151f 100%)",
				border: "rgba(0, 0, 0, 0.7)",
				text: "rgba(255, 255, 255, 0.8)",
			},
			glass: {
				primary: "#6B8FF0",
				background:
					"linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(107,143,240,0.1) 50%, rgba(107,143,240,0.2) 100%)",
				border: "rgba(255, 255, 255, 0.2)",
				topHighlight: "rgba(255, 255, 255, 0.6)",
				hoverOverlay: "rgba(255, 255, 255, 0.1)",
				outerGlow: {
					color: "#6B8FF0",
					opacity: "0.08",
				},
			},
		},
	},
	effects: {
		blur: {
			medium: "backdrop-blur-md",
			light: "backdrop-blur-sm",
		},
		shadow: {
			glass: "0 2px 8px rgba(5, 10, 20, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)",
			button:
				"inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 2px 8px rgba(5, 10, 20, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)",
			glassButton:
				"0 8px 20px rgba(107, 143, 240, 0.2), 0 3px 10px rgba(107, 143, 240, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.25), inset 0 -1px 0 rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.08)",
			elevated: "shadow-xl",
		},
	},
	borders: {
		radius: {
			modal: "12px",
			button: "8px",
		},
	},
	transitions: {
		default: "transition-all duration-200",
		button: "active:scale-[0.98]",
	},
} as const;

export type glassTokens = typeof glassTokens;

// Utility functions for easier usage
export const getGlassStyles = () => ({
	background: glassTokens.colors.glass.background,
	backdropFilter: glassTokens.effects.blur.medium,
	border: `1px solid ${glassTokens.colors.glass.border}`,
	borderRadius: glassTokens.borders.radius.modal,
	boxShadow: glassTokens.effects.shadow.elevated,
});

export const getGlassButtonStyles = () => ({
	background: glassTokens.colors.button.glassBase.background,
	border: `1px solid ${glassTokens.colors.button.glassBase.border}`,
	borderRadius: glassTokens.borders.radius.button,
	boxShadow: glassTokens.effects.shadow.button,
	color: glassTokens.colors.button.glassBase.text,
});

export const getTopHighlightStyles = () => ({
	background: `linear-gradient(to right, transparent, ${glassTokens.colors.glass.topHighlight}, transparent)`,
	height: "1px",
});

// Note: glass button styles are now implemented as CSS classes
// in style.css for better performance and maintainability

// Backward compatibility exports
export const glassmorphicTokens = glassTokens;
export type GlassmorphicTokens = glassTokens;
export const getGlassmorphicStyles = getGlassStyles;
export const getGlassmorphicButtonStyles = getGlassButtonStyles;
export const getGlassmorphicTopHighlightStyles = getTopHighlightStyles;
