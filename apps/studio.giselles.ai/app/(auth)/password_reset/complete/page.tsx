import Link from "next/link";
import { AuthButton } from "../../components/auth-button";

export default function CompleteResetPasswordPage() {
	return (
		<div className="min-h-screen flex items-center justify-center p-4 gap-16">
			<div className="flex items-center justify-center py-12">
				<div className="mx-auto grid w-[350px] gap-[24px]">
					<div className="text-center">
						<h2 className="mt-6 text-[28px] font-[500] text-accent font-sans text-center auth-title-glow">
							Set new password
						</h2>
						<p className="mt-4 text-[14px] font-geist text-[var(--color-link-muted)]">
							Your password has been successfully reset.
						</p>
					</div>
					<AuthButton asChild>
						<Link href="/workspaces">Continue</Link>
					</AuthButton>
				</div>
			</div>
		</div>
	);
}
