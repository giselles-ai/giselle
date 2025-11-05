"use client";

import { Slot } from "@radix-ui/react-slot";
import { useRouter } from "next/navigation";
import React from "react";
import { cn } from "@/lib/utils";
import { signOut } from "../../actions/sign-out";

export const SignOutButton = React.forwardRef<
	HTMLButtonElement,
	{ className?: string; children: React.ReactNode; asChild?: boolean }
>(({ className, children, asChild = false }, ref) => {
	const router = useRouter();
	const Comp = asChild ? Slot : "button";

	return (
		<Comp
			ref={ref}
			type="button"
			onClick={() => {
				signOut();
				router.push("/login");
			}}
			className={cn(
				// Only apply default styles when not used as a Slot
				!asChild &&
					"text-inverse font-medium text-[12px] leading-[20.4px] font-geist cursor-pointer",
				className,
			)}
		>
			{children}
		</Comp>
	);
});
SignOutButton.displayName = "SignOutButton";
