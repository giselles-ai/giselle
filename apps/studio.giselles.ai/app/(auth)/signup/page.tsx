import { MailIcon } from "lucide-react";
import Link from "next/link";
import { ClickableText } from "@/components/ui/clickable-text";
import { AuthContainer, AuthContainerHeader } from "../components";
import { ActionPrompt } from "../components/action-prompt";
import { AuthButton } from "../components/auth-button";
import { Divider } from "../components/divider";
import { LegalConsent } from "../components/legal-consent";
import { OAuthProviders } from "../components/oauth-providers";

export default function SignupPage() {
	return (
		<AuthContainer
			title="Unleash Your Potential"
			description="New here? Launch your first agent and start building with Giselle."
		>
			<AuthContainerHeader title="Get Started" />

			<div className="auth-form-section">
				<OAuthProviders labelPrefix="Sign up" />
			</div>

			<div className="auth-divider-section">
				<Divider label="or" />
			</div>

			<div className="auth-form-section">
				<AuthButton asChild>
					<Link
						href="/signup/email"
						className="flex items-center justify-center gap-2"
					>
						<MailIcon className="h-5 w-5" />
						<span className="font-sans font-medium">Sign up with Email</span>
					</Link>
				</AuthButton>
			</div>

			<div className="auth-legal-section">
				<LegalConsent />
			</div>

			<div className="auth-action-section">
				<ActionPrompt
					prompt="Already have an account?"
					action={
						<ClickableText asChild>
							<Link href="/login">Log in</Link>
						</ClickableText>
					}
				/>
			</div>
		</AuthContainer>
	);
}
