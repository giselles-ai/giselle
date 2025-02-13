import { PageHeader } from "../../components/page-header";
import { VerifyEmailForm } from "./verify-email-form";
export default function EmailConfirmationPage() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center">
			<div className="w-[320px] space-y-8">
				<PageHeader
					title="Verify your email"
					description="We've sent a confirmation code to your email. Please enter it below to complete your registration."
				/>
				<VerifyEmailForm />
			</div>
		</div>
	);
}
