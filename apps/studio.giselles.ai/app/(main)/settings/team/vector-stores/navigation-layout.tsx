import type { ReactNode } from "react";

import { VectorStoresSidebarMenu } from "./sidebar-menu";

type VectorStoresNavigationLayoutProps = {
	children: ReactNode;
};

export function VectorStoresNavigationLayout({
	children,
}: VectorStoresNavigationLayoutProps) {
	return (
		<div className="flex min-h-full">
			<div className="border-r border-border-muted pr-6">
				<div className="sticky top-[64px]">
					<VectorStoresSidebarMenu />
				</div>
			</div>
			<div className="flex-1 pl-[24px]">{children}</div>
		</div>
	);
}
