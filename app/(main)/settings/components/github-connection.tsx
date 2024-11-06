import { ClickableText } from "@/components/ui/clicable-text";
import { getUser } from "@/lib/supabase";
import type { GitHubUserClient } from "@/services/external/github/user-client";
import { SiGithub } from "@icons-pack/react-simple-icons";
import Link from "next/link";
import {
	connectGitHubIdentity,
	disconnectGitHubIdentity,
} from "../account/actions";
import {
	GitHubConnectButton,
	GitHubDisconnectButton,
} from "./github-connection-button";

type GitHubUser = Awaited<ReturnType<GitHubUserClient["getUser"]>>;

export async function GitHubConnection({
	gitHubUser,
}: {
	gitHubUser?: GitHubUser;
}) {
	const ConnectButton = async () => {
		if (!gitHubUser) {
			return <GitHubConnectButton action={connectGitHubIdentity} />;
		}

		const supabaseUser = await getUser();
		const unlinkable =
			supabaseUser.identities && supabaseUser.identities.length > 1;
		if (unlinkable) {
			return <GitHubDisconnectButton action={disconnectGitHubIdentity} />;
		}

		return null;
	};

	return (
		<div className="bg-transparent rounded-md border border-black-70 py-4 px-4 w-full font-avenir text-black-30">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<SiGithub className="h-[20px] w-[20px]" />
					<div className="flex flex-col">
						<div>GitHub</div>
						{gitHubUser && (
							<div className="text-black-70 text-[12px]">
								{gitHubUser.name} (
								<ClickableText asChild>
									<Link href={gitHubUser.html_url}>@{gitHubUser.login}</Link>
								</ClickableText>
								)
							</div>
						)}
					</div>
				</div>
				{ConnectButton()}
			</div>
		</div>
	);
}
