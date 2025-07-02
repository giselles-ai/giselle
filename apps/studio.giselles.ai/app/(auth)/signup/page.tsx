import { MailIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClickableText } from "@/components/ui/clickable-text";
import { AuthContainer, AuthContainerHeader } from "../components";
import { ActionPrompt } from "../components/action-prompt";
import { Divider } from "../components/divider";
import { LegalConsent } from "../components/legal-consent";
import { OAuthProviders } from "../components/oauth-providers";

export default function SignupPage() {
	return (
		<AuthContainer title="Unleash Your Potential">
			<AuthContainerHeader title="Get Started" />

			<div className="auth-form-section">
				<OAuthProviders labelPrefix="Sign up" />
			</div>

			<div className="auth-divider-section">
				<Divider label="or" />
			</div>

			<div className="auth-form-section">
				<Button asChild className="font-medium w-full justify-center">
					<Link
						href="/signup/email"
						className="flex items-center justify-center gap-2"
					>
						<MailIcon className="h-5 w-5" />
						<p className="font-sans font-medium">Sign up with Email</p>
					</Link>
				</Button>
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
