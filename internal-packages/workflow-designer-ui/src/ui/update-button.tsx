"use client";

import clsx from "clsx/lite";
import { Popover } from "radix-ui";
import {
	getGlassButtonStyles,
	glassmorphicTokens,
} from "./design-tokens/glassmorphic";

interface UpdateButtonProps {
	onClick: () => void;
	children?: React.ReactNode;
	className?: string;
}

export function UpdateButton({
	onClick,
	children = "Update",
	className = "",
}: UpdateButtonProps) {
	return (
		<Popover.Close
			onClick={onClick}
			className={clsx(
				"h-[32px] w-full flex items-center justify-center gap-[4px] text-[14px] px-4 py-2 cursor-pointer whitespace-nowrap",
				glassmorphicTokens.transitions.default,
				glassmorphicTokens.transitions.button,
				className,
			)}
			style={getGlassButtonStyles()}
		>
			{children}
		</Popover.Close>
	);
}
