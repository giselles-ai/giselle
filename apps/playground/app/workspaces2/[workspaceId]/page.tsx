import { Background } from "@giselle-internal/workflow-designer-ui";
import { WorkspaceId } from "@giselles-ai/protocol";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { dataLoader } from "./data-loader";
import { Page } from "./page.client";

function Loader() {
	return (
		<div className="h-screen w-full">
			<Background />
		</div>
	);
}

export default async function ({
	params,
}: {
	params: Promise<{
		workspaceId: string;
	}>;
}) {
	const { data: workspaceId, success } = WorkspaceId.safeParse(
		(await params).workspaceId,
	);
	if (!success) {
		console.error(params);
		return notFound();
	}

	return (
		<Suspense fallback={<Loader />}>
			<Page dataLoader={dataLoader(workspaceId)} />
		</Suspense>
	);
}
