"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { TriangleAlertIcon } from "lucide-react";
import { type FC, useActionState } from "react";
import { sendPasswordResetEmail } from "./actions";

export const Form: FC = () => {
	const [authError, action, isPending] = useActionState(
		sendPasswordResetEmail,
		null,
	);

	return (
		<form action={action}>
			<div className="grid gap-[16px]">
				{authError != null && (
					<Alert variant="destructive">
						<TriangleAlertIcon className="w-4 h-4" />
						<AlertTitle>Authentication Error</AlertTitle>
						<AlertDescription>
							{authError.message || "An error occurred. Please try again."}
						</AlertDescription>
					</Alert>
				)}
				<Field
					type="email"
					label="Enter your account's email address and we will send you a password reset link."
					name="email"
					ignore1password
				/>
				<Button type="submit" disabled={isPending}>
					Reset password
				</Button>
			</div>
		</form>
	);
};
