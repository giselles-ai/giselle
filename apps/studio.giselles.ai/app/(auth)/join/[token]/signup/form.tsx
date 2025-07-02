"use client";

import { TriangleAlertIcon } from "lucide-react";
import { useCallback, useState, useTransition } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupJoin } from "./actions";

interface SignupFormProps {
	email: string;
	token: string;
}

export const SignupForm = (props: SignupFormProps) => {
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const handleValidate = useCallback(() => {
		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return false;
		}
		setError(null);
		return true;
	}, [password, confirmPassword]);

	const handleSubmit = useCallback(
		(formData: FormData) => {
			if (!handleValidate()) return;
			formData.set("token", props.token);
			formData.set("email", props.email);
			formData.set("password", password);
			startTransition(async () => {
				const result = await signupJoin(formData);
				if (result?.error) {
					setError(result.error);
				}
			});
		},
		[props.token, props.email, password, handleValidate],
	);

	return (
		<form action={handleSubmit} className="font-sans">
			<input type="hidden" name="token" value={props.token} />
			<input type="hidden" name="email" value={props.email} />
			<div className="grid gap-6">
				{error && (
					<Alert variant="destructive">
						<TriangleAlertIcon className="w-4 h-4" />
						<AlertTitle>Error</AlertTitle>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
				<div className="grid gap-[16px]">
					<div className="grid gap-[4px]">
						<div className="grid gap-[4px] relative">
							<Label
								htmlFor="email"
								className="text-[14px] font-sans text-black-70"
							>
								Email
							</Label>
							<Input
								id="email"
								type="email"
								value={props.email}
								required
								readOnly
								className="text-white-400 bg-transparent py-[12px] px-0 read-only:border-none read-only:focus:outline-none read-only:focus:ring-0"
							/>
						</div>
					</div>

					<div className="grid gap-[4px]">
						<div className="grid gap-[4px] relative">
							<Label
								htmlFor="password"
								className="text-[14px] font-sans text-black-70"
							>
								Password
							</Label>
							<Input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
						</div>
					</div>
					<div className="grid gap-[4px]">
						<div className="grid gap-[4px] relative">
							<Label
								htmlFor="confirmPassword"
								className="text-[14px] font-sans text-black-70"
							>
								Confirm Password
							</Label>
							<Input
								id="confirmPassword"
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								required
							/>
						</div>
					</div>
					<Button
						className="w-full font-medium"
						type="submit"
						disabled={isPending}
						data-loading={isPending}
					>
						{isPending ? "Joining..." : "Join to team"}
					</Button>
				</div>
			</div>
		</form>
	);
};
