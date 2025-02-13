import { ClickableText } from "@/components/ui/clicable-text";
import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import { ActionPrompt } from "../../components/action-prompt";
import { PageHeader } from "../../components/page-header";

export default function SentPasswordResetMailPage() {
	return (
		<div className="min-h-screen flex items-center justify-center p-4 gap-16">
			<div className="flex items-center justify-center py-12">
				<div className="mx-auto grid w-[350px] gap-[24px]">
					<PageHeader
						title="Check your email"
						description="We have sent you an email with a link to reset your password. If you don't see the email, check other places it might be, like your junk, spam, social, or other folders."
					/>
					<div className="flex justify-center">
						<ActionPrompt
							leftIcon={
								<ChevronLeftIcon className="w-[16px] h-[16px] text-black-70" />
							}
							action={
								<ClickableText asChild>
									<Link href="/login">Back to log in</Link>
								</ClickableText>
							}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
