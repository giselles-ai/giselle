import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Divider } from "../../../components/divider";
import { LegalConsent } from "../../../components/legal-consent";
import { OAuthProviders } from "../../../components/oauth-providers";
import { declineInvitation } from "../actions";
import { fetchInvitationToken } from "../invitation";
import { LoginForm } from "./form";
import { authorizeJoinGitHub, authorizeJoinGoogle } from "./oauth-actions";

export default async function Page({
	params,
	searchParams,
}: {
	params: Promise<{ token: string }>;
	searchParams: Promise<{ authError?: string }>;
}) {
	const [{ token }, { authError }] = await Promise.all([params, searchParams]);
	const initialError =
		typeof authError === "string" && authError.trim() !== "" ? authError : null;

	const tokenObj = await fetchInvitationToken(token);
	if (!tokenObj) {
		return notFound();
	}
	if (tokenObj.expiredAt < new Date()) {
		redirect(`/join/${encodeURIComponent(token)}`);
	}

	return (
		<div className="min-h-screen flex items-center justify-center p-4 gap-16">
			<div className="flex items-center justify-center py-12">
				<div className="mx-auto grid w-[350px] gap-[24px]">
					<div className="text-center">
						<p className="text-white-400 mb-2">You have been invited to join</p>
						<h2
							className="text-[28px] font-[500] text-primary-100 font-sans"
							style={{ textShadow: "0px 0px 20px #0087F6" }}
						>
							{tokenObj.teamName}
						</h2>
					</div>
					<div className="grid gap-[16px]">
						<div className="grid gap-[12px]">
							<p className="text-sm text-slate-300 text-center">
								Please continue with the social account that uses{" "}
								<span className="font-medium">{tokenObj.invitedEmail}</span>.
							</p>
							<OAuthProviders
								labelPrefix="Join"
								returnUrl={`/join/${token}/oauth/callback`}
								additionalHiddenInputs={[
									{ name: "token", value: token },
									{ name: "invitedEmail", value: tokenObj.invitedEmail },
								]}
								googleAction={authorizeJoinGoogle}
								githubAction={authorizeJoinGitHub}
							/>
						</div>

						<Divider label="or" />

						<LoginForm
							email={tokenObj.invitedEmail}
							token={token}
							initialError={initialError}
						/>

						<div className="text-center text-sm text-slate-400">
							Don't have a Giselle account?{" "}
							<Link
								href={`/join/${token}/signup`}
								className="text-blue-300 hover:underline"
							>
								Sign up
							</Link>
						</div>

						<LegalConsent />
						<div className="flex justify-center mt-4">
							<form action={declineInvitation} className="contents">
								<input type="hidden" name="token" value={token} />
								<button
									type="submit"
									className="text-white hover:text-white/80 underline"
								>
									Decline
								</button>
							</form>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
