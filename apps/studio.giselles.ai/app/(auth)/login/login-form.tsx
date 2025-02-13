"use client";

import { type FC, useActionState } from "react";
import { Form } from "../components";
import { login } from "./login";

export const LoginForm: FC = () => {
	const [authError, action, isPending] = useActionState(login, null);
	return (
		<form action={action}>
			<Form
				linkToResetPassword={true}
				submitText="Log in"
				authError={authError}
				isPending={isPending}
			/>
		</form>
	);
};
