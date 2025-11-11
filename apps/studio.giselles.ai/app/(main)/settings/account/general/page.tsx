import { SignOutButton } from "@/services/accounts/components/user-button/sign-out-button";
import { Button } from "../../components/button";
import { Card } from "../../components/card";
import { Field } from "../../components/field";
import { AccountDisplayNameForm } from "../account-display-name-form";
import { getAccountInfo } from "../actions";

export default async function AccountGeneralPage() {
	const { displayName, email, avatarUrl } = await getAccountInfo();
	const alt = displayName || email || "";

	return (
		<div className="flex flex-col gap-[24px]">
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
						inputClassName="bg-transparent shadow-none border-none"
					/>
				</Card>
				<Card
					title="Session"
					description="Log out of all sessions."
					className="flex flex-row justify-between items-center gap-y-6"
				>
					<SignOutButton asChild>
						<Button variant="link">Log Out</Button>
					</SignOutButton>
				</Card>
			</div>
		</div>
	);
}
