import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LegalConsent } from "../../../components/legal-consent";
import { declineInvitation } from "../actions";
import { fetchInvitationToken } from "../invitation";
import { SignupForm } from "./form";

export default async function Page({
	params,
}: {
	params: Promise<{ token: string }>;
}) {
	const { token } = await params;

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
						<SignupForm email={tokenObj.invitedEmail} token={token} />

						<div className="text-center text-sm text-slate-400">
							Already have a Giselle account?{" "}
							<Link
								href={`/join/${token}/login`}
								className="text-blue-300 hover:underline"
							>
								Log in
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
