import Link from "next/link";
import { AuthButton } from "../../components/auth-button";

export default function Page() {
	const redirectTo = "/playground";

	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<div className="flex items-center justify-center py-12">
				<div className="flex flex-col items-center justify-center gap-6 max-w-md text-center px-6">
					<h1 className="text-[34px] font-[500] text-accent font-sans auth-title-glow">
						Welcome to Giselle!
					</h1>
					<div className="flex flex-col gap-4">
						<p className="text-[20px] text-text font-medium">Setup complete!</p>
						<p className="text-secondary text-center">
							Head over to your team account and start creating your own unique
							app. We can't wait to see what you'll build!
						</p>
						<div className="mt-2">
							<AuthButton asChild className="px-8 py-2 text-lg">
								<Link href={redirectTo}>Go to team</Link>
							</AuthButton>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
