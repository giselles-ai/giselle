import dynamic from "next/dynamic";

const GitHubAuthCompleteClient = dynamic(
	() => import("./github-auth-complete-client"),
	{
		ssr: false,
	},
);

export default function GitHubAuthComplete() {
	return <GitHubAuthCompleteClient />;
}
