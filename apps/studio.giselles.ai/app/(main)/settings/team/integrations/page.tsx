import { settingsV2Flag } from "@/flags";
import { notFound } from "next/navigation";
import { GitHubIntegration } from "../../integration/v2/github-integration";

export default async function TeamIntegrationsPage() {
	const settingsV2Mode = await settingsV2Flag();
	if (!settingsV2Mode) {
		return notFound();
	}
	return (
		<div className="flex flex-col gap-[24px]">
			<h3
				className="text-primary-100 font-semibold text-[28px] leading-[28px] tracking-[-0.011em] font-hubot"
				style={{ textShadow: "0px 0px 20px hsla(207, 100%, 48%, 1)" }}
			>
				Integration
			</h3>
			<div className="flex flex-col gap-y-4">
				<GitHubIntegration />
			</div>
		</div>
	);
}
