import Link from "next/link";
import { ClickableText } from "@/components/ui/clickable-text";
import { ActionPrompt } from "../components/action-prompt";

export default function NotFound() {
	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<div className="flex items-center justify-center py-12">
				<div className="mx-auto grid w-[350px] gap-[24px]">
					<div className="flex flex-col items-center justify-center gap-6">
						<h2 className="text-[28px] font-[500] text-white font-sans text-center">
							Invitation not found...
						</h2>
						<p className="text-white-400 text-center">
							The invitation link you are trying to access does not exist or has
							been removed.
						</p>
						<div className="flex flex-col items-center justify-center gap-2 mt-4">
							<div className="flex justify-center">
								<ActionPrompt
									prompt="Already have an account?"
									action={
										<ClickableText asChild>
											<Link href="/login">Log in</Link>
										</ClickableText>
									}
								/>
							</div>
							<div className="flex justify-center">
								<ActionPrompt
									prompt="or"
									action={
										<ClickableText asChild>
											<Link href="/signup">Create an account</Link>
										</ClickableText>
									}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
