"use client";

import { useGiselleEngine } from "@giselle-sdk/giselle/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export default function Home() {
	const router = useRouter();
	const giselleEngine = useGiselleEngine();

	const createWorkspace = useCallback(async () => {
		const workspace = await giselleEngine.createWorkspace({
			useExperimentalStorage: true,
		});
		router.push(`/workspaces/${workspace.id}`);
	}, [router.push, giselleEngine]);
	const createSampleWorkspace = useCallback(async () => {
		const workspace = await giselleEngine.createSampleWorkspace();
		router.push(`/workspaces/${workspace.id}`);
	}, [router.push, giselleEngine]);
	return (
		<div className="p-[24px] flex gap-[8px]">
			<button
				type="button"
				onClick={createWorkspace}
				className="cursor-pointer"
			>
				Create workspace
			</button>
			<button
				type="button"
				onClick={createSampleWorkspace}
				className="cursor-pointer"
			>
				Create sample workspace
			</button>
			<Link className="cursor-pointer" href="/ui">
				UI
			</Link>
		</div>
	);
}
