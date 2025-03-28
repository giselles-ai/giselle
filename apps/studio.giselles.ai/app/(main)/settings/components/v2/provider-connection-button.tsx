"use client";

import { Button } from "@/components/v2/ui/button";
import { useRouter } from "next/navigation";
import { useActionState } from "react";

type ButtonWithActionProps = {
	action: () => Promise<void>;
	children: React.ReactNode;
	className?: string;
};

export function ProviderConnectionButton({
	action,
	children,
	className,
}: ButtonWithActionProps) {
	const router = useRouter();

	const [_, formAction, isPending] = useActionState(async () => {
		await action();
		router.refresh();
	}, null);

	return (
		<form>
			<Button
				className={className}
				type="submit"
				formAction={formAction}
				disabled={isPending}
			>
				{children}
			</Button>
		</form>
	);
}
