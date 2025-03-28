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
			<div className="flex flex-col gap-y-2">
				<h3
					className="text-primary-100 font-semibold text-[28px] leading-[28px] tracking-[-0.011em] font-hubot"
					style={{ textShadow: "0px 0px 20px hsla(207, 100%, 48%, 1)" }}
				>
					Authentication
				</h3>
				<p className="text-black-400 font-medium text-[12px] leading-[20.4px] tracking-normal font-geist">
					Connect your Giselle Account with a third-party service to use it for
					login.
				</p>
			</div>
			<div className="flex flex-col gap-y-4">
				<Suspense
					fallback={
						<Skeleton className="rounded-md border border-black-70 w-full h-16" />
					}
				>
					<GoogleAuthentication />
				</Suspense>
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
