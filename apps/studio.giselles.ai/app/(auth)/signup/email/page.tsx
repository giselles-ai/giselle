import Link from "next/link";

import { ClickableText } from "@/components/ui/clickable-text";
import { AuthContainer, AuthContainerHeader } from "../../components";
import { ActionPrompt } from "../../components/action-prompt";
import { LegalConsent } from "../../components/legal-consent";
import { SignupForm } from "./signup-form";

export default function Page() {
	return (
		<AuthContainer
			title="Unleash Your Potential"
			description="New here? Launch your first agent and start building with Giselle."
		>
			<AuthContainerHeader title="Sign up with Email" />

			<div className="auth-form-section">
				<SignupForm />
			</div>

			<div className="auth-legal-section">
				<LegalConsent />
			</div>

			<div className="auth-action-section">
				<ActionPrompt
					prompt="Get started by "
					action={
						<ClickableText asChild>
							<Link href="/signup">other way?</Link>
						</ClickableText>
					}
				/>
			</div>
		</AuthContainer>
	);
}
