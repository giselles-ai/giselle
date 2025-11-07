"use client";

import { TriangleAlertIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthButton } from "../../../components/auth-button";
import { loginUser } from "./actions";

interface LoginFormProps {
	email: string;
	token: string;
}

export const LoginForm = (props: LoginFormProps) => {
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);
		const formData = new FormData(e.currentTarget);
		formData.set("token", props.token);
		startTransition(async () => {
			const result = await loginUser(formData);
			if (result?.error) {
				setError(result.error);
			}
		});
	};

	return (
		<form onSubmit={handleSubmit} className="font-sans">
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
								name="email"
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
								name="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
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
