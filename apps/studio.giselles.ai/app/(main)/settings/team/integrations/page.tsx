import { DocsLink } from "@giselle-internal/ui/docs-link";
import { GitHubIntegration } from "./github-integration";

export default function TeamIntegrationsPage() {
	return (
		<div className="flex flex-col gap-[24px]">
			<div className="flex justify-between items-center">
				<h1
					className="text-[30px] font-sans font-medium text-[hsl(192,73%,84%)]"
					style={{
						textShadow: "0 0 20px #0087f6, 0 0 40px #0087f6, 0 0 60px #0087f6",
					}}
				>
					Integrations
				</h1>
				<DocsLink
					href="https://docs.giselles.ai/en/guides/settings/team/integrations"
					target="_blank"
					rel="noopener noreferrer"
				>
					About Integrations
				</DocsLink>
			</div>
			<div className="flex flex-col gap-y-4">
				<GitHubIntegration />
			</div>
		</div>
	);
}
