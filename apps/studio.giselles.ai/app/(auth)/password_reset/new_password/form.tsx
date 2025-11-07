"use client";

import { TriangleAlertIcon } from "lucide-react";
import { type FC, useActionState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { resetPassword } from "./actions";

export const Form: FC = () => {
	const [authError, action, isPending] = useActionState(resetPassword, null);

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
					type="password"
					label="New password"
					name="new_password"
					className="bg-inverse/10"
				/>
				<Button type="submit" disabled={isPending} className="font-medium">
					Confirm
				</Button>
			</div>
		</form>
	);
};
