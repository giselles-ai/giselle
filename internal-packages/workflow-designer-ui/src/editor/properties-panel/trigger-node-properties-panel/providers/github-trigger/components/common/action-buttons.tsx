export interface ActionButtonsProps {
	/**
	 * Whether to show the back button
	 * @default true
	 */
	showBackButton?: boolean;

	/**
	 * Text for the back button
	 * @default "Back"
	 */
	backButtonText?: string;

	/**
	 * Text for the primary action button
	 */
	primaryButtonText: string;

	/**
	 * Whether the primary button is disabled
	 * @default false
	 */
	isPrimaryDisabled?: boolean;

	/**
	 * Whether the back button is disabled
	 * @default false
	 */
	isBackDisabled?: boolean;

	/**
	 * Handler for back button click
	 */
	onBack?: () => void;

	/**
	 * Handler for primary button click
	 */
	onPrimary: () => void;

	/**
	 * Optional class name to apply to the container
	 */
	className?: string;
}

/**
 * A reusable action buttons component that provides consistent styling
 * for back and primary action buttons across GitHub trigger components
 */
export function ActionButtons({
	showBackButton = true,
	backButtonText = "Back",
	primaryButtonText,
	isPrimaryDisabled = false,
	isBackDisabled = false,
	onBack,
	onPrimary,
	className = "",
}: ActionButtonsProps) {
	return (
		<div className={`flex gap-[8px] mt-[16px] px-[4px] ${className}`}>
			{showBackButton && (
				<button
					type="button"
					className="flex-1 bg-black-700 hover:bg-black-600 text-white font-medium px-4 py-2 rounded-md text-[14px] transition-colors disabled:opacity-50"
					onClick={onBack}
					disabled={isBackDisabled}
				>
					{backButtonText}
				</button>
			)}
			<button
				type="button"
				className="flex-1 bg-primary-900 hover:bg-primary-800 text-white font-medium px-4 py-2 rounded-md text-[14px] transition-colors disabled:opacity-50"
				onClick={onPrimary}
				disabled={isPrimaryDisabled}
			>
				{primaryButtonText}
			</button>
		</div>
	);
}
