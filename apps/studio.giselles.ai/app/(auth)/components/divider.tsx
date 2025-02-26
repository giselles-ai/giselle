import type { FC } from "react";

type DividerProps = {
	label?: string;
};
export const Divider: FC<DividerProps> = ({ label }) => {
	return (
		<div className="flex items-center">
			<div className="grow border-t border-black-70" />
			{label && (
				<span className="shrink mx-4 text-gray-500 text-sm">{label}</span>
			)}
			<div className="grow border-t border-black-70" />
		</div>
	);
};
