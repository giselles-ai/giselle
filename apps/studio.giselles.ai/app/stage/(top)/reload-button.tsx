"use client";

import { Button } from "@giselle-internal/ui/button";
import { RefreshCw } from "lucide-react";
import { useTransition } from "react";

export function ReloadButton({
	reloadAction,
}: {
	reloadAction: () => Promise<void>;
}) {
	const [isPending, startTransition] = useTransition();

	return (
		<form
			action={() => {
				startTransition(async () => {
					await reloadAction();
				});
			}}
		>
			<Button
				type="submit"
				variant="subtle"
				leftIcon={
					<RefreshCw className={`w-4 h-4${isPending ? " animate-spin" : ""}`} />
				}
				disabled={isPending}
			>
				Reload
			</Button>
		</form>
	);
}
