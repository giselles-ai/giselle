import { Card } from "@/components/ui/card";
import { db, githubRepositoryIndex } from "@/drizzle";
import { githubVectorStoreFlag } from "@/flags";
import { getGitHubIdentityState } from "@/services/accounts";
import { fetchCurrentTeam } from "@/services/teams";
import { desc, eq } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { deleteRepositoryIndex, registerRepositoryIndex } from "./actions";
import { RepositoryItem } from "./repository-item";
import { RepositoryRegistrationDialog } from "./repository-registration-dialog";

export default async function TeamVectorStorePage() {
	const vectorStoreFlag = await githubVectorStoreFlag();
	if (!vectorStoreFlag) {
		return notFound();
	}

	const githubIdentityState = await getGitHubIdentityState();
	if (
		githubIdentityState.status === "unauthorized" ||
		githubIdentityState.status === "invalid-credential"
	) {
		return <GitHubAuthRequiredCard />;
	}

	const userClient = githubIdentityState.gitHubUserClient;
	const installationData = await userClient.getInstallations();
	if (installationData.total_count === 0) {
		return <GitHubAppInstallRequiredCard />;
	}
	const installations = installationData.installations;

	const installationsWithRepos = await Promise.all(
		installations.map(async (installation) => {
			const repos = await userClient.getRepositories(installation.id);
			const installationId = installation.id;
			if (!installation.account) {
				throw new Error("Installation account is null");
			}

			const installationName =
				"login" in installation.account
					? installation.account.login
					: installation.account.name;

			return {
				installation: {
					id: installationId,
					name: installationName,
				},
				repositories: repos.repositories.map((repo) => ({
					id: repo.id,
					owner: repo.owner.login,
					name: repo.name,
				})),
			};
		}),
	);

	const repositoryIndexes = await getGitHubRepositoryIndexes();

	return (
		<div className="flex flex-col gap-[24px]">
			<div className="flex justify-between items-center">
				<h3
					className="text-primary-100 font-semibold text-[28px] leading-[28px] tracking-[-0.011em] font-hubot"
					style={{ textShadow: "0px 0px 20px hsla(207, 100%, 48%, 1)" }}
				>
					Vector Stores
				</h3>
				<a
					href="https://docs.giselles.ai/guides/settings/team/vector-store"
					target="_blank"
					rel="noopener noreferrer"
					className="text-black-300 text-[14px] font-medium border border-black-300 rounded-[4px] px-1.5 py-0.5 hover:bg-black-300/10 flex items-center gap-1.5 font-hubot"
				>
					About Vector Stores
					<ExternalLink size={14} />
				</a>
			</div>

			<RepositoryListCard
				registrationDialog={
					<RepositoryRegistrationDialog
						installationsWithRepos={installationsWithRepos}
						registerRepositoryIndexAction={registerRepositoryIndex}
					/>
				}
				repositoryIndexes={repositoryIndexes}
			/>
		</div>
	);
}

function GitHubAuthRequiredCard() {
	return (
		<div className="flex flex-col gap-[24px]">
			<h3
				className="text-primary-100 font-semibold text-[28px] leading-[28px] tracking-[-0.011em] font-hubot"
				style={{ textShadow: "0px 0px 20px hsla(207, 100%, 48%, 1)" }}
			>
				Vector Store
			</h3>
			<Card className="border-[0.5px] border-black-400 rounded-[8px] bg-transparent p-6">
				<div className="flex flex-col items-center justify-center py-8">
					<h4 className="text-white-400 font-medium text-[18px] leading-[21.6px] font-hubot mb-2">
						You need to authenticate your GitHub account.
					</h4>
					<p className="text-black-400 text-[14px] leading-[20.4px] font-geist text-center mb-4">
						To use Vector Store, you need to authenticate your GitHub account.
						Please authenticate in the account settings.
					</p>
					<a
						href="/settings/account/authentication"
						className="text-black-300 text-[14px] font-medium border border-black-300 rounded-[4px] px-4 py-2 hover:bg-black-300/10 flex items-center gap-1.5 font-hubot"
					>
						Open Authentication Settings
					</a>
				</div>
			</Card>
		</div>
	);
}

function GitHubAppInstallRequiredCard() {
	return (
		<div className="flex flex-col gap-[24px]">
			<h3
				className="text-primary-100 font-semibold text-[28px] leading-[28px] tracking-[-0.011em] font-hubot"
				style={{ textShadow: "0px 0px 20px hsla(207, 100%, 48%, 1)" }}
			>
				Vector Store
			</h3>
			<Card className="border-[0.5px] border-black-400 rounded-[8px] bg-transparent p-6">
				<div className="flex flex-col items-center justify-center py-8">
					<h4 className="text-white-400 font-medium text-[18px] leading-[21.6px] font-hubot mb-2">
						You need to install Giselle's GitHub App.
					</h4>
					<p className="text-black-400 text-[14px] leading-[20.4px] font-geist text-center mb-4">
						To use Vector Store, you need to install Giselle's GitHub App.
						Please install in the integrations settings.
					</p>
					<a
						href="/settings/team/integrations"
						className="text-black-300 text-[14px] font-medium border border-black-300 rounded-[4px] px-4 py-2 hover:bg-black-300/10 flex items-center gap-1.5 font-hubot"
					>
						Open Integrations Settings
					</a>
				</div>
			</Card>
		</div>
	);
}

type RepositoryListCardProps = {
	registrationDialog: React.ReactNode;
	repositoryIndexes: Awaited<ReturnType<typeof getGitHubRepositoryIndexes>>;
};

function RepositoryListCard({
	registrationDialog,
	repositoryIndexes,
}: RepositoryListCardProps) {
	return (
		<div className="flex flex-col gap-y-[16px]">
			<Card className="border-[0.5px] border-black-400 rounded-[8px] bg-transparent p-6">
				<div className="flex items-center mb-4">
					<div>
						<h4 className="text-white-400 font-medium text-[18px] leading-[21.6px] font-hubot">
							GitHub Repositories
						</h4>
						<p className="text-black-400 text-[14px] leading-[20.4px] font-geist mt-1">
							You can ingest your project's code into Vector Store and use it in
							GitHub Vector Store Nodes.
						</p>
					</div>
					<div className="ml-auto">{registrationDialog}</div>
				</div>

				{repositoryIndexes.length > 0 ? (
					<div className="space-y-4">
						{repositoryIndexes.map((index) => (
							<RepositoryItem
								key={index.id}
								repositoryIndex={index}
								deleteRepositoryIndexAction={deleteRepositoryIndex}
							/>
						))}
					</div>
				) : (
					<EmptyRepositoryCard />
				)}
			</Card>
		</div>
	);
}

function EmptyRepositoryCard() {
	return (
		<div className="text-black-400 text-center py-8">
			No repositories are registered. Please register a repository using the
			"Register Repository" button.
		</div>
	);
}

async function getGitHubRepositoryIndexes() {
	const team = await fetchCurrentTeam();
	const records = await db
		.select()
		.from(githubRepositoryIndex)
		.where(eq(githubRepositoryIndex.teamDbId, team.dbId))
		.orderBy(desc(githubRepositoryIndex.dbId));
	return records;
}
