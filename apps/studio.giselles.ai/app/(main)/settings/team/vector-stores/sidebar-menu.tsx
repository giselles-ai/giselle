"use client";

import { TabNavigation } from "@giselle-internal/ui/tab-navigation";

const LINKS = [
	{ href: "/settings/team/vector-stores", label: "GitHub" },
	{ href: "/settings/team/vector-stores/document", label: "Document" },
] as const;

export function VectorStoresSidebarMenu() {
	return <TabNavigation links={LINKS} ariaLabelPrefix="vector stores" />;
}
