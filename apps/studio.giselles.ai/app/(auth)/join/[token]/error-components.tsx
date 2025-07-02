import Link from "next/link";
import { ActionPrompt } from "@/app/(auth)/components/action-prompt";
import { Button } from "@/components/ui/button";
import { ClickableText } from "@/components/ui/clickable-text";
import { signoutUser } from "./actions";
import type { ErrorCode } from "./errors";

const errorMessages: Record<ErrorCode, string> = {
	expired: "This invitation has expired.",
	wrong_email:
		"The email address you're currently using doesn't match the email this invitation was intended for. To join this workspace, please sign out and then either sign in with the email address specified in the invitation or create a new account using that email address.",
} as const;

function ErrorPageLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen flex items-center justify-center p-4 gap-16">
			<div className="flex items-center justify-center py-12">
				<div className="mx-auto grid w-[350px] gap-[24px]">{children}</div>
			</div>
		</div>
	);
}

export function ExpiredError() {
	return (
		<ErrorPageLayout>
			<div className="flex flex-col items-center justify-center gap-6">
				<h2 className="text-[28px] font-[500] text-white font-sans text-center">
					{errorMessages.expired}
				</h2>
				<p className="text-white-400 text-center">
					Please ask the team administrator to send you a new invitation.
				</p>
				<div className="flex flex-col items-center justify-center gap-2 mt-4">
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
					<div className="flex justify-center">
						<ActionPrompt
							prompt="or"
							action={
								<ClickableText asChild>
									<Link href="/signup">Create an account</Link>
								</ClickableText>
							}
						/>
					</div>
				</div>
			</div>
		</ErrorPageLayout>
	);
}

export function WrongEmailError({
	teamName,
	token,
}: {
	teamName: string;
	token: string;
}) {
	return (
		<ErrorPageLayout>
			<div className="text-center">
				<p className="text-white-400 mb-2">You have been invited to join</p>
				<h2
					className="text-[28px] font-[500] text-primary-100 font-sans"
					style={{ textShadow: "0px 0px 20px #0087F6" }}
				>
					{teamName}
				</h2>
			</div>
			<div className="grid gap-[16px]">
				<div className="text-white text-center p-4 text-sm">
					{errorMessages.wrong_email}
				</div>
				<form action={signoutUser} method="POST">
					<input type="hidden" name="token" value={token} />
					<Button type="submit" className="w-full font-medium mt-2">
						Sign out
					</Button>
				</form>
			</div>
		</ErrorPageLayout>
	);
}
