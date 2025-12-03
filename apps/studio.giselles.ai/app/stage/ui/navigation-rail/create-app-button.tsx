"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useCallback } from "react";
import { useFormStatus } from "react-dom";
import { GlassButton } from "@/components/ui/glass-button";
import { MenuButton } from "./menu-button";
import type { NavigationRailState } from "./types";

type CreateWorkspaceState = {
	error?: string;
};

const initialState: CreateWorkspaceState = {};

export function CreateAppButton({ variant }: { variant: NavigationRailState }) {
	const router = useRouter();

	const createWorkspace = useCallback(
		async (_: CreateWorkspaceState): Promise<CreateWorkspaceState> => {
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
				return {};
			} catch (error) {
				console.error(error);
				return { error: "Failed to create workspace. Please try again." };
			}
		},
		[router],
	);

	const [state, formAction] = useActionState(createWorkspace, initialState);

	if (variant === "collapsed") {
		return (
			<form action={formAction}>
				<CollapsedButton />
				{state.error ? (
					<p className="text-sm text-error-500 mt-2" role="alert">
						{state.error}
					</p>
				) : null}
			</form>
		);
	}

	return (
		<form action={formAction} className="w-full">
			<ExpandedButton />
			{state.error ? (
				<p className="text-sm text-error-500 mt-2" role="alert">
					{state.error}
				</p>
			) : null}
		</form>
	);
}

function CollapsedButton() {
	const { pending } = useFormStatus();

	return (
		<MenuButton type="submit" disabled={pending} aria-label="Create App">
			<Plus className="size-5 text-link-muted stroke-1" />
		</MenuButton>
	);
}

function ExpandedButton() {
	const { pending } = useFormStatus();

	return (
		<GlassButton
			type="submit"
			aria-label="Create App"
			className="w-full whitespace-nowrap"
			disabled={pending}
		>
			<span className="grid place-items-center rounded-full size-4 bg-primary-200 opacity-50">
				<Plus className="size-3 text-background group-hover:text-background transition-colors" />
			</span>
			Create App
		</GlassButton>
	);
}
