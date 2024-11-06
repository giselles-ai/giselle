"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useActionState } from "react";

type ButtonWithActionProps = {
	action: () => Promise<void>;
};

const buttonClassNames = "w-fit font-avenir text-sm font-medium";

export function GitHubConnectButton({ action }: ButtonWithActionProps) {
	const [_, formAction, isPending] = useActionState(async () => {
		await action();
	}, null);
	return (
		<form>
			<Button
				className={buttonClassNames}
				type="submit"
				formAction={formAction}
				disabled={isPending}
			>
				Connect
			</Button>
		</form>
	);
}
export function GitHubDisconnectButton({ action }: ButtonWithActionProps) {
	const [_, formAction, isPending] = useActionState(async () => {
		await action();
	}, null);
	return (
		<form>
			<Button
				className={cn(buttonClassNames, "text-red-500")}
				type="submit"
				formAction={formAction}
				disabled={isPending}
			>
				Disconnect
			</Button>
		</form>
	);
}
