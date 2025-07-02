import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { GitHubAuthentication } from "../github-authentication";
import { GoogleAuthentication } from "../google-authentication";

export default function AccountAuthenticationPage() {
	return (
		<div className="flex flex-col gap-[12px]">
			<div className="flex flex-col gap-y-2">
				<h1
					className="text-[30px] font-sans font-medium text-[hsl(192,73%,84%)]"
					style={{
						textShadow: "0 0 20px #0087f6, 0 0 40px #0087f6, 0 0 60px #0087f6",
					}}
				>
					Authentication
				</h1>
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
