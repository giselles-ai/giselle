import type { FC, ReactNode } from "react";

type ActionPromptProps = {
	leftIcon?: ReactNode;
	prompt?: string;
	action: ReactNode;
};
export const ActionPrompt: FC<ActionPromptProps> = ({
	prompt,
	action,
	leftIcon,
}) => (
	<div className="text-[14px] text-black-30 font-rosart flex gap-[2px] items-center">
		{leftIcon && leftIcon}
		{prompt && <p>{prompt}</p>}
		{action}
	</div>
);
