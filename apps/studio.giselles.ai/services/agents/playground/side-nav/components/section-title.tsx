import type { FC } from "react";

type SectionTitleProps = {
	title: string;
};
export const SectionTitle: FC<SectionTitleProps> = ({ title }) => {
	return (
		<div className="flex items-center">
			<span className="flex-shrink text-black-30 text-[16px] font-rosart font-[500]">
				{title}
			</span>
			<div className="ml-[16px] flex-grow border-t border-black-80" />
		</div>
	);
};
