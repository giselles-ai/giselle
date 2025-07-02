import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CompleteResetPasswordPage() {
	return (
		<div className="min-h-screen flex items-center justify-center p-4 gap-16">
			<div className="flex items-center justify-center py-12">
				<div className="mx-auto grid w-[350px] gap-[24px]">
					<div className="text-center">
						<h2
							className="mt-6 text-[28px] font-[500] text-primary-100 font-sans text-center"
							style={{ textShadow: "0px 0px 20px #0087F6" }}
						>
							Set new password
						</h2>
						<p className="mt-4 text-[14px] font-geist text-primary-300">
							Your password has been successfully reset.
						</p>
					</div>
					<Button asChild className="font-medium">
						<Link href="/apps">Continue</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
