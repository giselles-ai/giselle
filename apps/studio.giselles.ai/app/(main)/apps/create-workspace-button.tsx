"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useCallback } from "react";
import { useFormStatus } from "react-dom";
import { GlassButton } from "@/components/ui/glass-button";

type CreateWorkspaceState = {
	error?: string;
};

const initialState: CreateWorkspaceState = {};

export function CreateWorkspaceButton() {
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

	return (
		<form action={formAction} className="flex flex-col items-start gap-2">
			<CreateWorkspaceSubmitButton />
			{state.error ? (
				<p className="text-sm text-error-500" role="alert">
					{state.error}
				</p>
			) : null}
		</form>
	);
}

function CreateWorkspaceSubmitButton() {
	const { pending } = useFormStatus();

	return (
		<GlassButton
			type="submit"
			aria-label="Create a workspace"
			className="whitespace-nowrap"
			disabled={pending}
		>
			<span className="grid place-items-center rounded-full size-4 bg-primary-200 opacity-50">
				<Plus className="size-3 text-bg" />
			</span>
			New Workspace
		</GlassButton>
	);
}
