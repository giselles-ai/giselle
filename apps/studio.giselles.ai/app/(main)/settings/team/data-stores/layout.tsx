import type { ReactNode } from "react";

export default function DataStoresLayout({
	children,
}: {
	children: ReactNode;
}) {
	return (
		<div className="h-full bg-bg -mx-[40px] -my-[24px]">
			<div className="w-full min-h-[calc(100vh-64px)] p-[24px] flex flex-col gap-y-3">
				{children}
			</div>
		</div>
	);
}
