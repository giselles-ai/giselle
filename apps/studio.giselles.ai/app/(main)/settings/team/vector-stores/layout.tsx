import type { ReactNode } from "react";

import { VectorStoresNavigationLayout } from "./navigation-layout";

export default function VectorStoresLayout({
	children,
}: {
	children: ReactNode;
}) {
	return (
		<VectorStoresNavigationLayout>{children}</VectorStoresNavigationLayout>
	);
}
