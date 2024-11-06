import { getOauthCredential, refreshOauthCredential } from "@/app/(auth)/lib";
import { GitHubUserClient } from "@/services/external/github/user-client";
import { GitHubConnection } from "../components/github-connection";

export default async function GitHubAuthentication() {
	const credential = await getOauthCredential("github");
	if (!credential) {
		return <GitHubConnection />;
	}

	const cli = new GitHubUserClient(credential, refreshOauthCredential);
	const gitHubUser = await cli.getUser();

	return <GitHubConnection gitHubUser={gitHubUser} />;
}
