"use client";

import { type FC, useActionState } from "react";
import { Form } from "../components";
import type { AuthComponentProps } from "../types";
import { login } from "./login";

export const LoginForm: FC<AuthComponentProps> = ({ returnUrl }) => {
	const [authError, action, isPending] = useActionState(login, null);
	return (
		<form action={action} className="font-sans">
			{returnUrl && <input type="hidden" name="returnUrl" value={returnUrl} />}
			<Form
				linkToResetPassword={true}
				submitText="Log in"
				authError={authError}
				isPending={isPending}
			/>
		</form>
	);
};
