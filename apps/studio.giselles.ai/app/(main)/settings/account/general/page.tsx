import { SignOutButton } from "@/services/accounts/components/user-button/sign-out-button";
import { ExternalLink } from "lucide-react";
import { Card } from "../../components/card";
import { Field } from "../../components/field";
import { AccountDisplayNameForm } from "../account-display-name-form";
import { getAccountInfo } from "../actions";

export default async function AccountGeneralPage() {
	const { displayName, email, avatarUrl } = await getAccountInfo();
	const alt = displayName || email || "";

	return (
		<div className="flex flex-col gap-[24px]">
			<div className="flex justify-between items-center">
				<h3
					className="text-primary-100 font-semibold text-[28px] leading-[28px] tracking-[-0.011em] font-hubot"
					style={{ textShadow: "0px 0px 20px hsla(207, 100%, 48%, 1)" }}
				>
					Account Settings
				</h3>
				<a
					href="https://docs.giselles.ai/guides/settings/account/general"
					target="_blank"
					rel="noopener noreferrer"
					className="text-black-300 text-[14px] font-medium rounded-[4px] px-1.5 py-0.5 hover:bg-black-300/10 flex items-center gap-1.5 font-hubot"
				>
					About Account Settings
					<ExternalLink size={14} />
				</a>
			</div>
			<div className="flex flex-col gap-y-4">
				<AccountDisplayNameForm
					displayName={displayName}
					avatarUrl={avatarUrl}
					alt={alt}
				/>
				<Card
					title="Email"
					description="This email will be used for account-related notifications."
					className="gap-y-6"
				>
					<Field
						label="*Email address (required)"
						name="email"
						type="email"
						value={email ?? "No email"}
						disabled
					/>
				</Card>
				<Card
					title="Session"
					description="Log out of all sessions."
					className="flex flex-row justify-between items-center gap-y-6"
				>
					<SignOutButton className="px-[16px] py-[4px] rounded-[6.32px] border border-primary-200 w-fit bg-primary-200 text-black-800 font-bold text-[14px] font-hubot whitespace-nowrap leading-[19.6px] tracking-normal hover:bg-transparent hover:text-primary-200">
						Log Out
					</SignOutButton>
				</Card>
			</div>
		</div>
	);
}
