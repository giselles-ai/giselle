import { Button } from "@/components/ui/button";
import { ClickableText } from "@/components/ui/clicable-text";
import { MailIcon } from "lucide-react";
import Link from "next/link";
import { ActionPrompt } from "../components/action-prompt";
import { Divider } from "../components/divider";
import { LegalConsent } from "../components/legal-consent";
import { OAuthProviders } from "../components/oauth-providers";
import { PageHeader } from "../components/page-header";

export default function SignupPage() {
	return (
		<div className="min-h-screen flex items-center justify-center p-4 gap-16">
			<div className="flex flex-col gap-[16px]">
				<h2
					className="text-[34px] font-[500] text-primary-100 text-left font-hubot"
					style={{ textShadow: "0px 0px 20px #0087F6" }}
				>
					Unleash Your Potential
				</h2>
			</div>
			<div className="mt-8 space-y-6 w-[320px]">
				<PageHeader title="Get Started" />
				<OAuthProviders labelPrefix="Sign up" />
				<Divider label="or" />
				<Button asChild className="font-medium">
					<Link href="/signup/email">
						<p className="font-hubot font-medium">Sign up for Email</p>
						<MailIcon className="h-5 w-5 mr-2" />
					</Link>
				</Button>
				<LegalConsent />
				<div className="flex justify-center">
					<ActionPrompt
						prompt="Already have an account?"
						action={
							<ClickableText asChild>
								<Link href="/login">Log in</Link>
							</ClickableText>
						}
					/>
				</div>
			</div>
		</div>
	);
}
