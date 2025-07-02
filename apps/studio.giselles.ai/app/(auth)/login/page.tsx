import Link from "next/link";
import { ClickableText } from "@/components/ui/clickable-text";
import { AuthContainer, AuthContainerHeader } from "../components";
import { ActionPrompt } from "../components/action-prompt";
import { Divider } from "../components/divider";
import { LegalConsent } from "../components/legal-consent";
import { OAuthProviders } from "../components/oauth-providers";
import { LoginForm } from "./login-form";

export default function Page() {
	return (
		<AuthContainer title="Welcome Back">
			<AuthContainerHeader title="Log in to Giselle" />

			<div className="auth-form-section">
				<OAuthProviders labelPrefix="Continue" />
			</div>

			<div className="auth-divider-section">
				<Divider label="or" />
			</div>

			<div className="auth-form-section">
				<LoginForm />
			</div>

			<div className="auth-legal-section">
				<LegalConsent />
			</div>

			<div className="auth-action-section">
				<ActionPrompt
					prompt="Don't have an account?"
					action={
						<ClickableText asChild>
							<Link href="/signup">Sign up</Link>
						</ClickableText>
					}
				/>
			</div>
		</AuthContainer>
	);
}
