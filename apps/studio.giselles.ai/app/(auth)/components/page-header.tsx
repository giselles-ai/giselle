import type { FC, ReactNode } from "react";
import { PageTitle } from "./page-title";

type PageHeaderProps = {
	title: ReactNode;
	description?: ReactNode;
};

export const PageHeader: FC<PageHeaderProps> = ({ title, description }) => (
	<div className="grid gap-[28px]">
		<PageTitle>{title}</PageTitle>
		{description && <p className="text-black-70 text-[14px]">{description}</p>}
	</div>
);
