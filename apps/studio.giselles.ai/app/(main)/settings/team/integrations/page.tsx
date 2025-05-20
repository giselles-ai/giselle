import { GitHubIntegration } from "./github-integration";

export default async function TeamIntegrationsPage() {
	return (
		<div className="flex flex-col gap-[24px]">
			<h3
				className="text-primary-100 font-semibold text-[28px] leading-[28px] tracking-[-0.011em] font-hubot"
				style={{ textShadow: "0px 0px 20px hsla(207, 100%, 48%, 1)" }}
			>
				Integrations
			</h3>
			<div className="flex flex-col gap-y-4">
				<GitHubIntegration />
			</div>
		</div>
	);
}
