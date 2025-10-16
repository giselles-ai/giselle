import { SiGithub, SiGoogle } from "@icons-pack/react-simple-icons";
import type { FC } from "react";
import { Button } from "@/components/ui/button";
import { authorizeGitHub, authorizeGoogle } from "../actions";
import type { AuthComponentProps } from "../types";

type HiddenInput = {
	name: string;
	value: string;
};

type OauthProvidersProps = AuthComponentProps & {
	labelPrefix: string;
	authorizeJoinGitHubAction?: (formData: FormData) => Promise<void>;
	authorizeJoinGoogleAction?: (formData: FormData) => Promise<void>;
	additionalHiddenInputs?: ReadonlyArray<HiddenInput>;
};

export const OAuthProviders: FC<OauthProvidersProps> = ({
	labelPrefix,
	returnUrl,
	authorizeJoinGitHubAction,
	authorizeJoinGoogleAction,
	additionalHiddenInputs,
}) => {
	const hiddenInputs: ReadonlyArray<HiddenInput> = [
		...(returnUrl ? [{ name: "returnUrl", value: returnUrl }] : []),
		...(additionalHiddenInputs ?? []),
	];

	return (
		<div className="space-y-2">
			<Button asChild variant="link">
				<form className="flex items-center w-full relative">
					<SiGoogle className="h-[20px] w-[20px] absolute left-[20px]" />
					{hiddenInputs.map((input) => (
						<input
							key={`${input.name}-${input.value}`}
							type="hidden"
							name={input.name}
							value={input.value}
						/>
					))}
					<button
						type="submit"
						formAction={authorizeJoinGoogleAction ?? authorizeGoogle}
						className="font-sans w-full text-center"
					>
						{labelPrefix} with Google
					</button>
				</form>
			</Button>

			<Button asChild variant="link">
				<form className="flex items-center w-full relative">
					<SiGithub className="h-[20px] w-[20px] absolute left-[20px]" />
					{hiddenInputs.map((input) => (
						<input
							key={`${input.name}-${input.value}`}
							type="hidden"
							name={input.name}
							value={input.value}
						/>
					))}
					<button
						type="submit"
						formAction={authorizeJoinGitHubAction ?? authorizeGitHub}
						className="font-sans w-full text-center"
					>
						{labelPrefix} with GitHub
					</button>
				</form>
			</Button>
		</div>
	);
};
