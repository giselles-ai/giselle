import { SiGithub, SiGoogle } from "@icons-pack/react-simple-icons";
import type { FC } from "react";
import { Button } from "@/components/ui/button";
import { authorizeGitHub, authorizeGoogle } from "../actions";

type OauthProvidersProps = {
	labelPrefix: string;
};

export const OAuthProviders: FC<OauthProvidersProps> = ({ labelPrefix }) => (
	<div className="space-y-2">
		<Button asChild variant="link">
			<form className="flex items-center w-full relative">
				<SiGoogle className="h-[20px] w-[20px] absolute left-[20px]" />
				<button
					type="submit"
					formAction={authorizeGoogle}
					className="font-sans w-full text-center"
				>
					{labelPrefix} with Google
				</button>
			</form>
		</Button>

		<Button asChild variant="link">
			<form className="flex items-center w-full relative">
				<SiGithub className="h-[20px] w-[20px] absolute left-[20px]" />
				<button
					type="submit"
					formAction={authorizeGitHub}
					className="font-sans w-full text-center"
				>
					{labelPrefix} with GitHub
				</button>
			</form>
		</Button>
	</div>
);
