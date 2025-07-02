import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import { ClickableText } from "@/components/ui/clickable-text";
import { ActionPrompt } from "../../components/action-prompt";

export default function SentPasswordResetMailPage() {
	return (
		<div className="min-h-screen flex items-center justify-center p-4 gap-16">
			<div className="flex items-center justify-center py-12">
				<div className="mx-auto grid w-[350px] gap-[24px]">
					<div className="text-center">
						<h2
							className="mt-6 text-[28px] font-[500] text-primary-100 font-sans text-center"
							style={{ textShadow: "0px 0px 20px #0087F6" }}
						>
							Check your email
						</h2>
						<p className="mt-4 text-[14px] font-geist text-primary-300">
							We have sent you an email with a link to reset your password. If
							you don't see the email, check other places it might be, like your
							junk, spam, social, or other folders.
						</p>
					</div>
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
