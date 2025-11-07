"use client";

import { TriangleAlertIcon } from "lucide-react";
import { useCallback, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthButton } from "../../../components/auth-button";
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
					<div className="text-error-900 bg-error-900/12 border border-error-900/40 rounded-[12px] p-3 text-[12px] font-geist">
						<div className="flex items-center gap-2">
							<TriangleAlertIcon className="w-4 h-4" />
							<span className="font-bold">Error</span>
						</div>
						<div className="mt-1">{error}</div>
					</div>
				)}
				<div className="grid gap-[16px]">
					<div className="grid gap-[4px]">
						<div className="grid gap-[4px] relative">
							<Label
								htmlFor="email"
								className="text-[14px] font-sans text-text"
							>
								Email
							</Label>
							<Input
								id="email"
								type="email"
								value={props.email}
								required
								readOnly
								className="text-text bg-transparent py-[12px] px-0 read-only:border-none read-only:focus:outline-none read-only:focus:ring-0"
							/>
						</div>
					</div>

					<div className="grid gap-[4px]">
						<div className="grid gap-[4px] relative">
							<Label
								htmlFor="password"
								className="text-[14px] font-sans text-text"
							>
								Password
							</Label>
							<Input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								className="bg-inverse/10"
							/>
						</div>
					</div>
					<div className="grid gap-[4px]">
						<div className="grid gap-[4px] relative">
							<Label
								htmlFor="confirmPassword"
								className="text-[14px] font-sans text-text"
							>
								Confirm Password
							</Label>
							<Input
								id="confirmPassword"
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								required
								className="bg-inverse/10"
							/>
						</div>
					</div>
					<AuthButton
						type="submit"
						disabled={isPending}
						data-loading={isPending}
					>
						{isPending ? "Joining..." : "Join to team"}
					</AuthButton>
				</div>
			</div>
		</form>
	);
};
