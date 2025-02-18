"use client";

import { callCreateWorkspaceApi } from "giselle-sdk";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export default function Home() {
	const router = useRouter();

	const createWorkspace = useCallback(async () => {
		const workspace = await callCreateWorkspaceApi();
		router.push(`/workspaces/${workspace.id}`);
	}, [router.push]);
	return (
		<button type="button" onClick={createWorkspace} className="cursor-pointer">
			Create workspace
		</button>
	);
}
