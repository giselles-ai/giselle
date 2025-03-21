import { Field } from "@/components/v2/ui/field";
import { settingsV2Flag } from "@/flags";
import { SignOutButton } from "@/services/accounts/components/v2/user-button/sign-out-button";
import { notFound } from "next/navigation";
import { Card } from "../../components/v2/card";
import { getAccountInfo } from "../actions";
import { AccountDisplayNameForm } from "../v2/account-display-name-form";

export default async function AccountGeneralPage() {
	const { displayName, email } = await getAccountInfo();
	const settingsV2Mode = await settingsV2Flag();
	if (!settingsV2Mode) {
		return notFound();
	}
	return (
		<div className="flex flex-col gap-[24px]">
			<h3
				className="text-primary-100 font-semibold text-[28px] leading-[28px] tracking-[-0.011em] font-hubot"
				style={{ textShadow: "0px 0px 20px hsla(207, 100%, 48%, 1)" }}
			>
				General
			</h3>
			<div className="flex flex-col gap-y-4">
				<AccountDisplayNameForm displayName={displayName} />
				<Card
					title="Email"
					description="Enter the email addresses you want to use to log in with Giselle. Your primary email will be used for account-related notifications."
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
					description="Log out of all session"
					className="flex flex-row justify-between items-center gap-y-6"
				>
					<SignOutButton className="px-[16px] py-[4px] rounded-[6.32px] border border-primary-200 w-fit bg-primary-200 text-black-800 font-bold text-[14px] font-hubot whitespace-nowrap leading-[19.6px] tracking-normal hover:bg-transparent hover:text-primary-200">
						Log out
					</SignOutButton>
				</Card>
			</div>
		</div>
	);
}
