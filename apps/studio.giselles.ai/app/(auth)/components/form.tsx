"use client";

import { TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthError } from "@/lib/supabase";

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
					<Label
						htmlFor="email"
						className="text-[14px] font-sans text-gray-200"
					>
						Email
					</Label>
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
					<div className="grid gap-[4px] relative">
						<Label
							htmlFor="password"
							className="text-[14px] font-sans text-gray-200"
						>
							Password
						</Label>
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
						{linkToResetPassword && (
							<Link
								href="/password_reset"
								className="text-[14px] text-primary-100 absolute top-0 right-0 font-geist underline"
							>
								Forgot your password?
							</Link>
						)}
					</div>
					{validationError && "password" in validationError && (
						<p className="text-red-500 text-sm mt-1">
							{validationError.password}
						</p>
					)}
				</div>
				<Button
					className="w-full font-medium"
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
