import { ClickableText } from "@/components/ui/clicable-text";
import { Alert, AlertDescription, AlertTitle } from "@/components/v2/ui/alert";
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
		<div className="grid gap-4 rounded-[8px] border-[0.5px] border-black-400 rounded-[8px] bg-black-400/10 py-4 px-4 w-full">
			{alert && (
				<Alert variant="destructive" className="p-4">
					<TriangleAlertIcon className="w-[18px] h-[18px] text-error-900/80" />
					<AlertTitle className="mb-0 text-error-900 font-bold text-[12px] leading-[20.4px] font-geist">
						Authentication Error
					</AlertTitle>
					<AlertDescription className="text-error-900/70 font-medium text-[12px] leading-[20.4px] font-geist">
						{alert}
					</AlertDescription>
				</Alert>
			)}
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<SiGoogle className="text-white-400 h-[20px] w-[20px]" />
					<div className="flex flex-col">
						<div className="text-white-400 font-medium text-[16px] leading-[22.4px] font-geist">
							Google
						</div>

						{googleUser && (
							<div className="text-black-400 font-medium text-[12px] leading-[20.4px] font-geist">
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
