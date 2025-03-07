"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthError } from "@/lib/supabase";
import { TriangleAlertIcon } from "lucide-react";
import Link from "next/link";

type FormProps<T extends Record<string, string | undefined>> = {
	authError: AuthError | null;
	linkToResetPassword?: boolean;
	submitText?: string;
	isPending: boolean;
	validationError?: T | null;
};

export const Form = <T extends Record<string, string | undefined>>({
	linkToResetPassword = false,
	submitText = "Submit",
	authError,
	isPending,
	validationError,
}: FormProps<T>) => {
	return (
		<div className="grid gap-6">
			{authError && (
				<Alert variant="destructive">
					<TriangleAlertIcon className="w-4 h-4" />
					<AlertTitle>Authentication Error</AlertTitle>
					<AlertDescription>
						{authError.message || "An error occurred. Please try again."}
					</AlertDescription>
				</Alert>
			)}
			<div className="grid gap-[16px]">
				<div className="grid gap-[4px]">
					<Label htmlFor="email">Email</Label>
					<Input
						id="email"
						type="email"
						name="email"
						required
						className={
							validationError && "email" in validationError
								? "border-red-500"
								: ""
						}
					/>
					{validationError && "email" in validationError && (
						<p className="text-red-500 text-sm mt-1">{validationError.email}</p>
					)}
				</div>
				<div className="grid gap-[4px]">
					<div className="flex items-center">
						<Label htmlFor="password">Password</Label>
						{linkToResetPassword && (
							<Link
								href="/password_reset"
								className="ml-auto text-[12px] text-black-70"
							>
								Forgot your password?
							</Link>
						)}
					</div>
					<Input
						id="password"
						type="password"
						name="password"
						required
						className={
							validationError && "password" in validationError
								? "border-red-500"
								: ""
						}
					/>
					{validationError && "password" in validationError && (
						<p className="text-red-500 text-sm mt-1">
							{validationError.password}
						</p>
					)}
				</div>
				<Button
					className="w-full"
					type="submit"
					disabled={isPending}
					data-loading={isPending}
				>
					{submitText}
				</Button>
			</div>
		</div>
	);
};
