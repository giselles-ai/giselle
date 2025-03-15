import { Button } from "@/components/v2/ui/button";
import { getGitHubIdentityState } from "@/services/accounts";
import { gitHubAppInstallURL } from "@/services/external/github";
import { SiGithub } from "@icons-pack/react-simple-icons";
import type { components } from "@octokit/openapi-types";
import Link from "next/link";
import { GitHubAppInstallButton } from "../../../../../packages/components/v2/github-app-install-button";

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
		<div className="flex items-center justify-between p-4 border-[0.5px] border-black-400 rounded-[8px] bg-black-400/10">
			<div className="flex items-center space-x-4">
				<SiGithub className="w-8 h-8" />
				<div>
					<h2 className="text-white-400 text-[16px] leading-[22.4px] font-medium font-geist">
						GitHub
					</h2>
					{account ? (
						<div className="text-12px leading-[20.4px] text-black-400 font-medium font-geist">
							Logged in as (<span className="text-blue-80">@{account}</span>)
						</div>
					) : (
						<div className="text-[12px] leading-[20.4px] text-black-400 font-medium font-geist">
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
					<Button asChild>
						<Link href="/settings/account/authentcation">
							Configure GitHub App
						</Link>
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
		<div className="overflow-hidden rounded-lg border border-black-400">
			<div className="flex items-center gap-x-2 border-b border-black-400  px-4 py-2 bg-black-400">
				{avatarUrl && (
					<img
						src={avatarUrl}
						alt={displayName}
						className="w-6 h-6 rounded-full"
					/>
				)}
				<span className="text-white-400 font-medium text-[12px] leading-[12px] font-hubot">
					{displayName}
				</span>
			</div>
			<div className="py-4 space-y-2">
				{installation.repositories.map((repo) => (
					<div key={repo.id} className="flex items-center gap-x-2 px-4">
						<a
							href={repo.html_url}
							target="_blank"
							rel="noopener noreferrer"
							className="text-white-400 font-medium text-sm leading-[19.6px] font-hubot hover:underline"
						>
							{repo.name}
						</a>
						<span className="rounded-full px-2 py-0.5 text-white-400 font-medium text-xs leading-[20.4px] font-geist border border-white-800">
							{repo.private ? "Private" : "Public"}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
