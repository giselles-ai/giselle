"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
	const buttonClassNames = "w-fit font-avenir text-sm font-medium";
	const router = useRouter();

	const [_, formAction, isPending] = useActionState(async () => {
		await action();
		router.refresh();
	}, null);

	return (
		<form>
			<Button
				className={cn(buttonClassNames, className)}
				type="submit"
				formAction={formAction}
				disabled={isPending}
			>
				{children}
			</Button>
		</form>
	);
}
