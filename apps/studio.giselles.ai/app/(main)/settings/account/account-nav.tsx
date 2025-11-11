"use client";

import { TabNavigation } from "@giselle-internal/ui/tab-navigation";

const LINKS = [
	{ href: "/settings/account", label: "Overview" },
	{ href: "/settings/account/general", label: "General" },
	{ href: "/settings/account/authentication", label: "Authentication" },
] as const;

export function AccountSettingsNav() {
	return <TabNavigation links={LINKS} ariaLabelPrefix="menu" />;
}
