"use client";

import { useGiselleEngine } from "giselle-sdk/react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export default function Home() {
	const router = useRouter();
	const giselleEngine = useGiselleEngine();

	const createWorkspace = useCallback(async () => {
		const workspace = await giselleEngine.createWorkspace();
		router.push(`/workspaces/${workspace.id}`);
	}, [router.push, giselleEngine]);
	return (
		<button type="button" onClick={createWorkspace} className="cursor-pointer">
			Create workspace
		</button>
	);
}
