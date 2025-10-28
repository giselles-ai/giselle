import { NewEditor } from "@giselle-internal/workflow-designer-ui";
import { WorkspaceId } from "@giselle-sdk/data-type";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { giselleEngine } from "@/app/giselle-engine";
import { newEditorFlag } from "@/flags";

export default async function Page({
	params,
}: {
	params: Promise<{ workspaceId: string }>;
}) {
	const enableNewEditor = await newEditorFlag();
	if (!enableNewEditor) {
		return notFound();
	}

	const { workspaceId } = await params;
	const workspacePromise = giselleEngine.getWorkspace(
		WorkspaceId.parse(workspaceId),
	);
	return (
		<Suspense
			fallback={
				<div className="text-white h-screen flex items-center justify-center">
					Loading...
				</div>
			}
		>
			<NewEditor workspace={workspacePromise} />
		</Suspense>
	);
}
