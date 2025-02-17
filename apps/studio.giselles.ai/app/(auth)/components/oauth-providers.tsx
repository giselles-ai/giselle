import { Button } from "@/components/ui/button";
import { SiGithub, SiGoogle } from "@icons-pack/react-simple-icons";
import type { FC } from "react";
import { authorizeGitHub, authorizeGoogle } from "../actions";

type OauthProvidersProps = {
	labelPrefix: string;
};

export const OAuthProviders: FC<OauthProvidersProps> = ({ labelPrefix }) => (
	<div className="space-y-2">
		<Button asChild variant="link">
			<form>
				<SiGoogle className="h-[20px] w-[20px]" />
				<button type="submit" formAction={authorizeGoogle}>
					{labelPrefix} with Google
				</button>
			</form>
		</Button>

		<Button asChild variant="link">
			<form>
				<SiGithub className="h-[20px] w-[20px]" />
				<button type="submit" formAction={authorizeGitHub}>
					{labelPrefix} with GitHub
				</button>
			</form>
		</Button>
	</div>
);
