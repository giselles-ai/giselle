"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { GlassButton } from "@/components/ui/glass-button";
import { MenuButton } from "./menu-button";
import type { NavigationRailState } from "./types";

export function CreateAppButton({
	variant,
}: {
	variant: NavigationRailState;
}) {
	const router = useRouter();
	const [isCreating, setIsCreating] = useState(false);

	const handleCreateApp = useCallback(async () => {
		if (isCreating) return;
		setIsCreating(true);
		try {
			const response = await fetch("/api/workspaces", { method: "POST" });
			if (!response.ok) {
				throw new Error(`Failed to create workspace: ${response.status}`);
			}

			const data = (await response.json()) as { redirectPath?: string };
			if (!data.redirectPath) {
				throw new Error("Missing redirect path");
			}

			router.push(data.redirectPath);
		} catch (error) {
			console.error(error);
			setIsCreating(false);
		}
	}, [router, isCreating]);

	if (variant === "collapsed") {
		return (
			<MenuButton
				onClick={handleCreateApp}
				disabled={isCreating}
				aria-label="Create App"
			>
				<Plus className="size-5 text-link-muted stroke-1" />
			</MenuButton>
		);
	}

	return (
		<GlassButton
			type="button"
			onClick={handleCreateApp}
			aria-label="Create App"
			className="w-full whitespace-nowrap"
			disabled={isCreating}
		>
			<span className="grid place-items-center rounded-full size-4 bg-primary-200 opacity-50">
				<Plus className="size-3 text-background group-hover:text-background transition-colors" />
			</span>
			Create App
		</GlassButton>
	);
}
