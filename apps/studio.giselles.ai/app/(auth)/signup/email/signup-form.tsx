"use client";

import type { AuthError } from "@/lib/supabase";
import { type FC, useActionState } from "react";
import { Form } from "../../components";
import { useSignupContext } from "../context";
import { signup } from "./signup";

export const SignupForm: FC = () => {
	const { dispatch } = useSignupContext();
	const [authError, action, isPending] = useActionState(
		(prevState: AuthError | null, formData: FormData) => {
			// type-casting here for convenience
			// in practice, you should validate your inputs
			const email = formData.get("email") as string;
			const password = formData.get("password") as string;

			dispatch({ type: "SET_EMAIL", email });

			return signup(email, password);
		},
		null,
	);
	return (
		<form action={action}>
			<Form submitText="Sign up" authError={authError} isPending={isPending} />
		</form>
	);
};
