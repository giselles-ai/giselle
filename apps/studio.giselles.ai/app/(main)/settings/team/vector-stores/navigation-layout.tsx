import type { ReactNode } from "react";

import { VectorStoresSidebarMenu } from "./sidebar-menu";

type VectorStoresNavigationLayoutProps = {
	children: ReactNode;
	isEnabled?: boolean;
};

export function VectorStoresNavigationLayout({
	children,
	isEnabled = true,
}: VectorStoresNavigationLayoutProps) {
	if (!isEnabled) {
		return <>{children}</>;
	}

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
