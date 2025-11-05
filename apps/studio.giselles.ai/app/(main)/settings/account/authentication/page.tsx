import { DocsLink } from "@giselle-internal/ui/docs-link";
import { PageHeading } from "@giselle-internal/ui/page-heading";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { GitHubAuthentication } from "../github-authentication";
import { GoogleAuthentication } from "../google-authentication";

export default async function AccountAuthenticationPage({
	searchParams,
}: {
	searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const params = await searchParams;
	const oauthError =
		typeof params?.oauthError === "string" ? params.oauthError : undefined;
	return (
		<div className="flex flex-col gap-[12px]">
			<div className="flex items-center justify-between">
				<PageHeading as="h1" glow>
					Authentication
				</PageHeading>
				<DocsLink
					href="https://docs.giselles.ai/en/guides/settings/account/authentication"
					target="_blank"
					rel="noopener noreferrer"
				>
					About Authentication
				</DocsLink>
			</div>
	<p className="text-[var(--color-link-muted)] text-[12px] leading-[20.4px] tracking-normal font-geist">
				Connect your Giselle Account with a third-party service to use it for
				login.
			</p>
			{oauthError && (
				<div className="text-error-900 bg-error-900/12 border border-error-900/40 rounded-[12px] p-3 text-[12px] font-geist">
					OAuth Error: {oauthError}
				</div>
			)}
			<div className="flex flex-col gap-y-4">
				<Suspense
					fallback={
						<Skeleton className="rounded-md border border-border-muted w-full h-16" />
					}
				>
					<GoogleAuthentication />
				</Suspense>
				<Suspense
					fallback={
						<Skeleton className="rounded-md border border-border-muted w-full h-16" />
					}
				>
					<GitHubAuthentication />
				</Suspense>
			</div>
		</div>
	);
}
