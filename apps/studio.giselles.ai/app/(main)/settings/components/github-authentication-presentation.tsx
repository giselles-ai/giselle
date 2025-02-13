import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ClickableText } from "@/components/ui/clicable-text";
import { SiGithub } from "@icons-pack/react-simple-icons";
import type { components } from "@octokit/openapi-types";
import { TriangleAlertIcon } from "lucide-react";
import Link from "next/link";

type GitHubUser = components["schemas"]["simple-user"];

type GitHubAuthenticationPresentationProps = {
	gitHubUser?: GitHubUser;
	button?: () => React.ReactNode;
	alert?: string;
};
export function GitHubAuthenticationPresentation({
	gitHubUser,
	button,
	alert,
}: GitHubAuthenticationPresentationProps) {
	return (
		<div className="grid gap-4 bg-transparent rounded-md border border-black-70 py-4 px-4 w-full font-avenir text-black-30">
			{alert && (
				<Alert variant="destructive">
					<TriangleAlertIcon className="w-4 h-4" />
					<AlertTitle>Authentication Error</AlertTitle>
					<AlertDescription>{alert}</AlertDescription>
				</Alert>
			)}
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
								</ClickableText>{" "}
								)
							</div>
						)}
					</div>
				</div>
				{button?.()}
			</div>
		</div>
	);
}
