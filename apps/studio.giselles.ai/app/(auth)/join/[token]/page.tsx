import type { User } from "@supabase/auth-js";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/supabase";
import { declineInvitation, joinTeam } from "./actions";
import { ExpiredError, WrongEmailError } from "./error-components";
import { fetchInvitationToken } from "./invitation";

export default async function Page({
	params,
}: {
	params: Promise<{ token: string }>;
}) {
	const { token: tokenParam } = await params;

	const token = await fetchInvitationToken(tokenParam);
	if (!token) {
		return notFound();
	}
	if (token.expiredAt < new Date()) {
		return <ExpiredError />;
	}

	let user: User | null = null;
	try {
		user = await getUser();
	} catch (_e) {
		// redirect to signup page
		redirect(`/join/${encodeURIComponent(tokenParam)}/signup`);
	}

	if (user.email !== token.invitedEmail) {
		return <WrongEmailError teamName={token.teamName} token={tokenParam} />;
	}

	return (
		<div className="min-h-screen flex items-center justify-center p-4 gap-16">
			<div className="flex items-center justify-center py-12">
				<div className="mx-auto grid w-[350px] gap-[24px]">
					<div className="text-center">
						<p className="text-slate-400 mb-2">You have been invited to join</p>
						<h2
							className="text-[28px] font-[500] text-primary-100 font-sans"
							style={{ textShadow: "0px 0px 20px #0087F6" }}
						>
							{token.teamName}
						</h2>
					</div>
					<div className="grid gap-[16px]">
						<form action={joinTeam} className="contents">
							<input type="hidden" name="token" value={tokenParam} />
							<Button type="submit" className="w-full font-medium">
								Join to team
							</Button>
						</form>

						<div className="text-sm text-center text-slate-400 mt-4">
							By continuing, you agree to our{" "}
							<Link href="/terms" className="text-blue-300 hover:underline">
								Terms of Service
							</Link>{" "}
							and{" "}
							<Link href="/privacy" className="text-blue-300 hover:underline">
								Privacy Policy
							</Link>
							.
						</div>

						<div className="flex justify-center mt-4">
							<form action={declineInvitation} className="contents">
								<input type="hidden" name="token" value={tokenParam} />
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
