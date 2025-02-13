"use client";

import { useRouter } from "next/navigation";
import type { FC } from "react";
import { signOut } from "../../actions/sign-out";

export const SignOutButton: FC = () => {
	const router = useRouter();

	return (
		<button
			type="button"
			onClick={() => {
				signOut();
				router.push("/login");
			}}
		>
			Logout
		</button>
	);
};
