"use client";

import { TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthError } from "@/lib/supabase";
import { AuthButton } from "./auth-button";

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
				<div className="text-error-900 bg-error-900/12 border border-error-900/40 rounded-[12px] p-3 text-[12px] font-geist">
					<div className="flex items-center gap-2">
						<TriangleAlertIcon className="w-4 h-4" />
						<span className="font-bold">Authentication Error</span>
					</div>
					<div className="mt-1">
						{authError.message || "An error occurred. Please try again."}
					</div>
				</div>
			)}
			<div className="grid gap-[16px]">
				<div className="grid gap-[4px]">
					<Label htmlFor="email" className="text-[14px] font-sans text-text">
						Email
					</Label>
					<Input
						id="email"
						type="email"
						name="email"
						required
						className={
							validationError && "email" in validationError
								? "bg-inverse/10 border-error"
								: "bg-inverse/10"
						}
					/>
					{validationError && "email" in validationError && (
						<p className="text-error text-sm mt-1">{validationError.email}</p>
					)}
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
							name="password"
							required
							className={
								validationError && "password" in validationError
									? "bg-inverse/10 border-error"
									: "bg-inverse/10"
							}
						/>
						{linkToResetPassword && (
							<Link
								href="/password_reset"
								className="text-[14px] text-text absolute top-0 right-0 font-geist underline hover:text-text/80"
							>
								Forgot your password?
							</Link>
						)}
					</div>
					{validationError && "password" in validationError && (
						<p className="text-error text-sm mt-1">
							{validationError.password}
						</p>
					)}
				</div>
				<AuthButton
					className="w-full"
					type="submit"
					disabled={isPending}
					data-loading={isPending}
				>
					{submitText}
				</AuthButton>
			</div>
		</div>
	);
};
