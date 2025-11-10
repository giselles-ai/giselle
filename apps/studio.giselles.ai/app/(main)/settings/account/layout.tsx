import { PageHeading } from "@giselle-internal/ui/page-heading";
import type { ReactNode } from "react";
import { AccountSettingsNav } from "./account-nav";
import { AccountDocsLink } from "./components/account-docs-link";

export default function SettingsAccountLayout({
	children,
}: {
	children: ReactNode;
}) {
	return (
		<div className="h-full bg-bg">
			<div className="w-full min-h-[calc(100vh-64px)] p-[24px] flex flex-col gap-y-3">
				<div className="flex justify-between items-center">
					<PageHeading as="h1" glow>
						Account settings
					</PageHeading>
					<AccountDocsLink />
				</div>
				<AccountSettingsNav />
				<div>{children}</div>
			</div>
		</div>
	);
}
