import type { ReactNode } from "react";

import { docVectorStoreFlag } from "@/flags";

import { VectorStoresNavigationLayout } from "./navigation-layout";

export default async function VectorStoresLayout({
	children,
}: {
	children: ReactNode;
}) {
	const isDocVectorStoreEnabled = await docVectorStoreFlag();

	return (
		<VectorStoresNavigationLayout isEnabled={isDocVectorStoreEnabled}>
			{children}
		</VectorStoresNavigationLayout>
	);
}
