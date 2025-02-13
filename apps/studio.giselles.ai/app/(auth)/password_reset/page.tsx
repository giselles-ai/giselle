import { ClickableText } from "@/components/ui/clicable-text";
import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import { ActionPrompt } from "../components/action-prompt";
import { PageHeader } from "../components/page-header";
import { Form } from "./form";

export default function ResetPasswordPage() {
	return (
		<div className="min-h-screen flex items-center justify-center p-4 gap-16">
			<div className="flex items-center justify-center py-12">
				<div className="mx-auto grid w-[350px] gap-[24px]">
					<PageHeader title="Reset your password" />
					<Form />
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
