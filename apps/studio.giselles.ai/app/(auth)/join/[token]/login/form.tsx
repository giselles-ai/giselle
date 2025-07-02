"use client";

import { TriangleAlertIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
								name="email"
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
								name="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
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
