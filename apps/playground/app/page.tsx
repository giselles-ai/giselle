"use client";

import { useGiselle } from "@giselles-ai/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export default function Home() {
	const router = useRouter();
	const giselle = useGiselle();

	const createWorkspace = useCallback(async () => {
		const workspace = await giselle.createWorkspace();
		router.push(`/workspaces/${workspace.id}`);
	}, [router.push, giselle]);
	const createSampleWorkspace = useCallback(async () => {
		const workspaces = await giselle.createSampleWorkspaces();
		// Use the first workspace if multiple are created
		if (Array.isArray(workspaces) && workspaces.length > 0 && workspaces[0]) {
			const workspace = workspaces[0];
			router.push(`/workspaces/${workspace.id}`);
		}
	}, [router.push, giselle]);
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
