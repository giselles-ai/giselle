export const COMMON_STYLES = {
	// Layout utilities
	centerFlex: "flex items-center justify-center",
	centerFlexCol: "flex flex-col items-center justify-center",

	// Button styles
	generationButton:
		"flex items-center justify-center px-[24px] py-[12px] mt-[16px] bg-[#141519] text-white rounded-[9999px] border border-white-900/15 transition-all hover:bg-[#1e1f26] hover:border-white-900/25 hover:translate-y-[-1px] cursor-pointer font-sans font-[500] text-[14px]",

	// Container styles
	githubAuthContainer:
		"bg-white-900/10 h-[300px] rounded-[8px] flex items-center justify-center",
	githubAuthButton:
		"group cursor-pointer bg-black-900 rounded-[4px] py-[4px] flex items-center justify-center gap-[8px] disabled:opacity-50 disabled:cursor-wait",

	// Panel styles
	panelResizeHandle:
		"h-[12px] flex items-center justify-center cursor-row-resize",
	iconContainer: "w-[60px] flex items-center justify-center",
} as const;
