import type { FC, PropsWithChildren } from "react";

export const PageTitle: FC<PropsWithChildren> = ({ children }) => (
	<h2 className="mt-6 text-3xl font-[400] text-black-30 font-rosart text-center">
		{children}
	</h2>
);
