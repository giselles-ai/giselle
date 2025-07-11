import type React from "react";

export interface FieldDisplayProps {
	/**
	 * The label for the field
	 */
	label: string;

	/**
	 * The content to display
	 */
	children: React.ReactNode;

	/**
	 * Optional class name to apply to the container
	 */
	className?: string;

	/**
	 * Optional class name to apply to the content area
	 */
	contentClassName?: string;

	/**
	 * Whether to apply the standard content padding
	 * @default true
	 */
	applyContentPadding?: boolean;
}

/**
 * A reusable field display component that provides consistent styling
 * for labeled content across GitHub trigger components
 */
export function FieldDisplay({
	label,
	children,
	className = "",
	contentClassName = "",
	applyContentPadding = true,
}: FieldDisplayProps) {
	const defaultContentClasses = applyContentPadding
		? "px-[4px] py-[8px]"
		: "px-[4px]";

	return (
		<div className={className}>
			<p className="text-[14px] text-[#F7F9FD]">{label}</p>
			<div className={`${defaultContentClasses} ${contentClassName}`}>
				{children}
			</div>
		</div>
	);
}
