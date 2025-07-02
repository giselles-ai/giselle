"use client";

import { TriangleAlertIcon } from "lucide-react";
import { type FC, useActionState, useCallback, useRef } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ClickableText } from "@/components/ui/clickable-text";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import { ActionPrompt } from "../../components/action-prompt";
import { useSignupContext } from "../context";
import { resendOtp, verifyEmail } from "./verify-email";

export const VerifyEmailForm: FC = () => {
	const { state } = useSignupContext();
	const [verifyState, verifyAction, isVerifyPending] = useActionState(
		verifyEmail,
		null,
	);
	const [resendState, resendAction, isResendPending] = useActionState(
		resendOtp,
		null,
	);
	const formRef = useRef<HTMLFormElement>(null);
	const handleComplete = useCallback(() => {
		formRef.current?.requestSubmit();
	}, []);
	const handleResend: React.MouseEventHandler<HTMLButtonElement> = (e) => {
		e.preventDefault();
		const formData = new FormData(formRef.current || undefined);
		resendAction(formData);
	};

	return (
		<div className="grid gap-[8px]">
			{verifyState && (
				<Alert variant="destructive">
					<TriangleAlertIcon className="w-4 h-4" />
					<AlertTitle>Authentication Error</AlertTitle>
					<AlertDescription>
						{verifyState.message || "An error occurred. Please try again."}
					</AlertDescription>
				</Alert>
			)}
			{resendState && resendState.code !== "success" && (
				<Alert variant="destructive">
					<TriangleAlertIcon className="w-4 h-4" />
					<AlertTitle>Authentication Error</AlertTitle>
					<AlertDescription>
						{resendState.message || "An error occurred. Please try again."}
					</AlertDescription>
				</Alert>
			)}
			{resendState && resendState.code === "success" && (
				<Alert variant="primary">
					<TriangleAlertIcon className="w-4 h-4" />
					<AlertTitle>Success</AlertTitle>
					<AlertDescription>
						{resendState.message || "Resend completed!"}
					</AlertDescription>
				</Alert>
			)}
			<form className="flex justify-center" action={verifyAction} ref={formRef}>
				<div className="grid gap-4">
					<InputOTP
						maxLength={6}
						data-1p-ignore
						name="token"
						onComplete={handleComplete}
						className="notranslate" // prevent Google Chrome translation to avoid DOM error
					>
						<InputOTPGroup>
							<InputOTPSlot index={0} />
							<InputOTPSlot index={1} />
							<InputOTPSlot index={2} />
						</InputOTPGroup>
						<InputOTPSeparator />
						<InputOTPGroup>
							<InputOTPSlot index={3} />
							<InputOTPSlot index={4} />
							<InputOTPSlot index={5} />
						</InputOTPGroup>
					</InputOTP>
					<input type="hidden" name="verificationEmail" value={state.email} />

					<div className="flex justify-center">
						<ActionPrompt
							prompt="Didn't receive a code?"
							action={
								<ClickableText
									onClick={handleResend}
									disabled={isResendPending}
								>
									Click to resend
								</ClickableText>
							}
						/>
					</div>
					<Button
						className="w-full font-medium"
						type="submit"
						disabled={isVerifyPending}
					>
						Verify
					</Button>
				</div>
			</form>
		</div>
	);
};
