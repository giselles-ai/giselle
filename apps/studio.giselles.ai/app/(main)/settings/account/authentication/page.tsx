import { Skeleton } from "@/components/ui/skeleton";
import { settingsV2Flag } from "@/flags";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Card } from "../../components/v2/card";
import { GitHubAuthentication } from "../v2/github-authentication";
import { GoogleAuthentication } from "../v2/google-authentication";

export default async function AccountAuthenticationPage() {
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
				Authentication
			</h3>
			<div className="flex flex-col gap-y-4">
				<Card
					title="Authentication"
					description="Connect your Giselle Account with a third-party service to use it for login."
				>
					<Suspense
						fallback={
							<Skeleton className="rounded-md border border-black-70 w-full h-16" />
						}
					>
						<div className="flex flex-wrap	items-center gap-4">
							<GoogleAuthentication />
						</div>
					</Suspense>
				</Card>
				<Suspense
					fallback={
						<Skeleton className="rounded-md border border-black-70 w-full h-16" />
					}
				>
					<GitHubAuthentication />
				</Suspense>
			</div>
		</div>
	);
}
