import { Button } from "@/components/ui/button";
import { getGitHubIdentityState } from "@/services/accounts";
import { gitHubAppInstallURL } from "@/services/external/github";
import { SiGithub } from "@icons-pack/react-simple-icons";
import type { components } from "@octokit/openapi-types";
import Link from "next/link";
import { GitHubAppInstallButton } from "../../../../packages/components/github-app-install-button";

export async function GitHubIntegration() {
	const installUrl = await gitHubAppInstallURL();
	const identityState = await getGitHubIdentityState();
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
		<div className="space-y-8 text-black-30">
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
		<div className="flex items-center justify-between">
			<div className="flex items-center space-x-3">
				<SiGithub className="w-8 h-8" />
				<div>
					<h2 className="text-lg">GitHub</h2>
					{account ? (
						<div className="text-sm text-muted-foreground">
							Logged in as (<span className="text-blue-500">@{account}</span>)
						</div>
					) : (
						<div className="text-sm text-muted-foreground">Not connected</div>
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
					<Button asChild>
						<Link href="/settings/account">Connect</Link>
					</Button>
				)}
			</div>
		</div>
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
		<div className="overflow-hidden rounded-lg border border-black-70">
			<div className="flex items-center space-x-3 border-b border-black-70 p-3 bg-black-70">
				{avatarUrl && (
					<img
						src={avatarUrl}
						alt={displayName}
						className="w-6 h-6 rounded-full"
					/>
				)}
				<span>{displayName}</span>
			</div>
			<div className="p-4 space-y-3">
				{installation.repositories.map((repo) => (
					<div key={repo.id} className="flex items-center">
						<a
							href={repo.html_url}
							target="_blank"
							rel="noopener noreferrer"
							className="text-sm hover:underline"
						>
							{repo.name}
						</a>
						<span className="ml-2 rounded-full px-2 py-0.5 text-xs border border-black-30">
							{repo.private ? "Private" : "Public"}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
