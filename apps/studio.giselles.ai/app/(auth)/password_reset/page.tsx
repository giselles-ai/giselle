import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import { ClickableText } from "@/components/ui/clickable-text";
import { AuthContainer, AuthContainerHeader } from "../components";
import { ActionPrompt } from "../components/action-prompt";
import { Form } from "./form";

export default function ResetPasswordPage() {
	return (
		<AuthContainer title="Reset Your Password">
			<AuthContainerHeader
				title="Enter your email"
				description="Enter your account's email address and we will send you a password reset link."
			/>

			<div className="auth-form-section">
				<Form />
			</div>

			<div className="auth-action-section">
				<ActionPrompt
					leftIcon={
						<ChevronLeftIcon className="w-[16px] h-[16px] text-gray-200" />
					}
					action={
						<ClickableText asChild>
							<Link href="/login">Back to log in</Link>
						</ClickableText>
					}
				/>
			</div>
		</AuthContainer>
	);
}
