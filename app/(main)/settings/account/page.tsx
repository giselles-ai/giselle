import { ClickableText } from "@/components/ui/clicable-text";
import { Field } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { getUser } from "@/lib/supabase";
import Link from "next/link";
import { Suspense } from "react";
import { Card } from "../components/card";
import { GitHubAuthentication } from "./github-authentication";

export default async function AccountSettingPage() {
	const user = await getUser();
	return (
		<div className="grid gap-[16px]">
			<h3
				className="text-[32px] text-black--30 font-rosart"
				style={{ textShadow: "0px 0px 20px hsla(207, 100%, 48%, 1)" }}
			>
				Account
			</h3>
			<Card title="Account Information">
				<div className="max-w-[600px] mb-[4px]">
					<Field
						label="Email"
						name="email"
						type="email"
						value={user.email}
						disabled
					/>
				</div>
			</Card>
			<Card
				title="Authentication"
				description="Connect your Giselle account to third-party services."
			>
				<Suspense
					fallback={
						<Skeleton className="rounded-md border border-black-70 w-full h-16" />
					}
				>
					<GitHubAuthentication />
				</Suspense>
			</Card>
			<Card
				title="Reset Password"
				action={{
					content: "Reset Password",
					href: "/password_reset/new_password",
				}}
			/>
			<Card title="Delete Account">
				<div className="w-[220px]">
					<ClickableText asChild>
						<Link href="mailto:support@giselles.ai?Subject=Please%20delete%20my%20giselle%20account">
							Contact Support
						</Link>
					</ClickableText>
				</div>
			</Card>
		</div>
	);
}
