import { VerifyEmailForm } from "./verify-email-form";
export default function EmailConfirmationPage() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center">
			<div className="w-[320px] space-y-8">
				<div className="text-center">
					<h2 className="mt-6 text-[28px] font-[500] text-accent font-sans text-center auth-title-glow">
						Verify your email
					</h2>
					<p className="mt-4 text-[14px] font-geist text-secondary">
						We've sent a confirmation code to your email. Please enter it below
						to complete your registration.
					</p>
				</div>
				<VerifyEmailForm />
			</div>
		</div>
	);
}
