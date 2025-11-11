import type { ReactNode } from "react";

import { VectorStoresSidebarMenu } from "./sidebar-menu";

type VectorStoresNavigationLayoutProps = {
	children: ReactNode;
};

export function VectorStoresNavigationLayout({
	children,
}: VectorStoresNavigationLayoutProps) {
	return (
		<div className="flex flex-col min-h-full">
			<VectorStoresSidebarMenu />
			<div className="flex-1">{children}</div>
		</div>
	);
}
