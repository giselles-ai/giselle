import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Page() {
	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<div className="flex items-center justify-center py-12">
				<div className="flex flex-col items-center justify-center gap-6 max-w-md text-center px-6">
					<h1
						className="text-[34px] font-[500] text-primary-100 font-sans"
						style={{ textShadow: "0px 0px 20px #0087F6" }}
					>
						Welcome to Giselle!
					</h1>
					<div className="flex flex-col gap-4">
						<p className="text-[20px] text-white-400 font-medium">
							Setup complete!
						</p>
						<p className="text-white-400 text-center">
							Head over to your team account and start creating your own unique
							app. We can't wait to see what you'll build!
						</p>
						<div className="mt-2">
							<Link href="/apps">
								<Button className="px-8 py-2 text-lg bg-primary-200 hover:bg-primary-300 text-black-900">
									Go to team
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
