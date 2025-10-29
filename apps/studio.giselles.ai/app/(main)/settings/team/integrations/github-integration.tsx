import { Button } from "@giselle-internal/ui/button";
import { SiGithub } from "@icons-pack/react-simple-icons";
import type { components } from "@octokit/openapi-types";
import { TriangleAlertIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GitHubAppInstallButton } from "@/packages/components/github-app-install-button";
import { getGitHubIdentityState } from "@/services/accounts";
import { gitHubAppInstallURL } from "@/services/external/github";
import { Card } from "../../components/card";

export async function GitHubIntegration() {
	const identityState = await getGitHubIdentityState();
	if (identityState.status === "error") {
		return <GitHubError message={identityState.errorMessage} />;
	}

	const installUrl = await gitHubAppInstallURL();
	if (installUrl == null) {
		return <GitHubError message="Failed to get GitHub App installation URL." />;
	}
	if (
		identityState.status === "unauthorized" ||
		identityState.status === "invalid-credential"
	) {
		return <GitHubIntegrationPresentation installationUrl={installUrl} />;
	}

	const gitHubUserClient = identityState.gitHubUserClient;
	const { installations } = await gitHubUserClient.getInstallations();
	const installationsWithRepos = await Promise.all(
		installations.map(async (installation) => {
			const repos = await gitHubUserClient.getRepositories(installation.id);
			return {
				...installation,
				repositories: repos.repositories,
			};
		}),
	);
	const gitHubUser = identityState.gitHubUser;

	return (
		<GitHubIntegrationPresentation
			account={gitHubUser.login}
			installations={installationsWithRepos}
			installationUrl={installUrl}
		/>
	);
}

type GitHubErrorProps = {
	message: string;
};

function GitHubError({ message }: GitHubErrorProps) {
	return (
		<Alert variant="destructive" className="p-4">
			<TriangleAlertIcon className="w-[18px] h-[18px] text-error-900/80" />
			<AlertTitle className="mb-0 text-error-900 font-bold text-[12px] leading-[20.4px] font-geist">
				Authentication Error
			</AlertTitle>
			<AlertDescription className="text-error-900/70 font-medium text-[12px] leading-[20.4px] font-geist">
				{message}
			</AlertDescription>
		</Alert>
	);
}

type Repository = components["schemas"]["repository"];
type Installation = components["schemas"]["installation"];
type InstallationWithRepositories = Installation & {
	repositories: Repository[];
};

type GitHubIntegrationPresentationProps = {
	account?: string;
	installations?: InstallationWithRepositories[];
	installationUrl?: string;
};

function GitHubIntegrationPresentation({
	account,
	installations,
	installationUrl,
}: GitHubIntegrationPresentationProps) {
	const installed = installations != null && installations?.length > 0;
	return (
		<div className="space-y-6">
			<Header
				account={account}
				installed={installed}
				installationUrl={installationUrl}
			/>
			{installed && (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{installations.map((installation) => (
						<Installation key={installation.id} installation={installation} />
					))}
				</div>
			)}
		</div>
	);
}

type HeaderProps = {
	account?: string;
	installed: boolean;
	installationUrl?: string;
};

function Header({ account, installed, installationUrl }: HeaderProps) {
	return (
		<Card title="">
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-4">
					<SiGithub className="w-8 h-8" />
					<div>
						<h2 className="text-text text-[16px] leading-[22.4px] font-medium font-geist">
							GitHub
						</h2>
						{account ? (
							<div className="text-12px leading-[20.4px] text-text-muted font-medium font-geist">
								Logged in as (<span className="text-blue-80">@{account}</span>)
							</div>
						) : (
							<div className="text-[12px] leading-[20.4px] text-text-muted font-medium font-geist">
								Not connected
							</div>
						)}
					</div>
				</div>
				<div>
					{account && installationUrl ? (
						<GitHubAppInstallButton
							installationUrl={installationUrl}
							installed={installed}
						/>
					) : (
						<Button asChild variant="primary" size="large">
							<Link href="/settings/account/authentication">
								Configure GitHub App
							</Link>
						</Button>
					)}
				</div>
			</div>
		</Card>
	);
}

type InstallationProps = {
	installation: InstallationWithRepositories;
};

function Installation({ installation }: InstallationProps) {
	const account = installation.account;
	if (!account) {
		return null;
	}

	const displayName = "login" in account ? account.login : account.name || "";
	const avatarUrl = "avatar_url" in account ? account.avatar_url : undefined;

	return (
		<div className="rounded-lg px-4 pt-4 pb-6 flex flex-col bg-gradient-to-b from-[#202530] to-[#12151f] border border-border-muted shadow-[0_2px_8px_rgba(5,10,20,0.4),0_1px_2px_rgba(0,0,0,0.3)]">
			<div className="flex items-center gap-x-2">
				{avatarUrl && (
					<Image
						src={avatarUrl}
						alt={displayName}
						width={24}
						height={24}
						className="w-6 h-6 rounded-full"
					/>
				)}
				<span className="text-text font-medium text-[14px] leading-[14px] font-geist">
					{displayName}
				</span>
			</div>
			<div className="h-px w-full bg-inverse/10 my-4" />
			<div className="space-y-5">
				{installation.repositories.map((repo) => (
					<div key={repo.id} className="flex items-center gap-x-2">
						<a
							href={repo.html_url}
							target="_blank"
							rel="noopener noreferrer"
							className="text-text font-medium text-[14px] leading-[19.6px] font-geist hover:underline"
						>
							{repo.name}
						</a>
						<span className="rounded-full px-2 py-px text-inverse/70 font-medium text-[10px] leading-normal font-geist border border-white/20">
							{repo.private ? "Private" : "Public"}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
