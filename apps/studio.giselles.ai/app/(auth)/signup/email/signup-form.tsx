"use client";

import { type FC, useActionState, useState } from "react";
import { safeParse } from "valibot";
import type { AuthError } from "@/lib/supabase";
import { Form } from "../../components";
import { useSignupContext } from "../context";
import { signup } from "./signup";
import { signupSchema, type ValidationErrors } from "./validations";

export const SignupForm: FC = () => {
	const { dispatch } = useSignupContext();
	const [validationError, setValidationError] =
		useState<ValidationErrors | null>(null);

	const [authError, action, isPending] = useActionState(
		(prevState: AuthError | null, formData: FormData) => {
			const email = formData.get("email") as string;
			const password = formData.get("password") as string;

			const result = safeParse(signupSchema, { email, password });

			if (!result.success) {
				const errors: ValidationErrors = {};

				for (const issue of result.issues) {
					const path = issue.path?.[0]?.key;
					if (path === "email" || path === "password") {
						errors[path] = issue.message;
					}
				}

				setValidationError(errors);
				return prevState;
			}

			setValidationError(null);
			dispatch({ type: "SET_EMAIL", email });

			return signup(email, password);
		},
		null,
	);
	return (
		<form action={action} noValidate>
			<Form<ValidationErrors>
				submitText="Sign up"
				authError={authError}
				isPending={isPending}
				validationError={validationError}
			/>
		</form>
	);
};
