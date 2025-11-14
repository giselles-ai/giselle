import { DocsLink } from "@giselle-internal/ui/docs-link";
import { PageHeading } from "@giselle-internal/ui/page-heading";
import type { ReactNode } from "react";

import { VectorStoresNavigationLayout } from "./navigation-layout";

export default function VectorStoresLayout({
	children,
}: {
	children: ReactNode;
}) {
	return (
		<div className="h-full bg-bg -mx-[40px] -my-[24px]">
			<div className="w-full min-h-[calc(100vh-64px)] p-[24px] flex flex-col gap-y-3">
				<div className="flex justify-between items-center">
					<PageHeading as="h1" glow>
						Vector Stores
					</PageHeading>
					<DocsLink
						href="https://docs.giselles.ai/en/guides/settings/team/vector-stores"
						target="_blank"
						rel="noopener noreferrer"
					>
						About Vector Stores
					</DocsLink>
				</div>
				<VectorStoresNavigationLayout>{children}</VectorStoresNavigationLayout>
			</div>
		</div>
	);
}
