import type { ReactNode } from "react";

export default function SettingsTeamLayout({
	children,
}: {
	children: ReactNode;
}) {
	return (
		<div className="px-[40px] py-[24px] flex-1 max-w-[1200px] mx-auto w-full">
			{children}
		</div>
	);
}
