import { PageHeading } from "@giselle-internal/ui/page-heading";
import type React from "react";

interface UiPageProps {
	title: string;
	children: React.ReactNode;
}

export function UiPage({ title, children }: UiPageProps) {
	return (
		<>
			<PageHeading as="h1" glow className="mb-6 text-[24px]">
				{title}
			</PageHeading>
			<div className="space-y-8">{children}</div>
		</>
	);
}
