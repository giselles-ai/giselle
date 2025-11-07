import type { FC } from "react";

type DividerProps = {
	label?: string;
};
export const Divider: FC<DividerProps> = ({ label }) => {
	return (
		<div className="flex items-center">
			<div className="grow border-t border-inverse/20" />
			{label && (
				<span className="shrink mx-4 text-text text-[16px] font-semibold">
					{label}
				</span>
			)}
			<div className="grow border-t border-inverse/20" />
		</div>
	);
};
