import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ClickableText } from "@/components/ui/clicable-text";
import type {
	GoogleUserClient,
	GoogleUserData,
} from "@/services/external/google";
import { SiGoogle } from "@icons-pack/react-simple-icons";
import { TriangleAlertIcon } from "lucide-react";
import Link from "next/link";

type GoogleUser = Awaited<GoogleUserData>;

type GoogleAuthenticationPresentationProps = {
	googleUser?: GoogleUser;
	button?: () => React.ReactNode;
	alert?: string;
};
export function GoogleAuthenticationPresentation({
	googleUser,
	button,
	alert,
}: GoogleAuthenticationPresentationProps) {
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
					<SiGoogle className="h-[20px] w-[20px]" />
					<div className="flex flex-col">
						<div>Google</div>

						{googleUser && (
							<div className="text-black-70 text-[12px]">
								{googleUser.name} ({googleUser.email})
							</div>
						)}
					</div>
				</div>
				{button?.()}
			</div>
		</div>
	);
}
