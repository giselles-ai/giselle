import { DocsLink } from "@giselle-internal/ui/docs-link";
import { PageHeading } from "@giselle-internal/ui/page-heading";
import type { ReactNode } from "react";
import { CreateWorkspaceButton } from "./create-workspace-button";

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<div className="h-full bg-bg" data-scope="workspaces">
			<div className="px-[40px] py-[24px] flex-1 max-w-[1200px] mx-auto w-full">
				<div className="flex justify-between items-center mb-8">
					<PageHeading glow>Workspaces</PageHeading>
					<div className="flex items-center gap-4">
						<DocsLink
							href="https://docs.giselles.ai/en/guides/apps/teamapp"
							target="_blank"
							rel="noopener noreferrer"
						/>
						<CreateWorkspaceButton />
					</div>
				</div>
				{children}
			</div>
		</div>
	);
}
