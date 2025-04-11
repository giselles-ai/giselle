import { ExternalLink } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export default async function SettingsAccountLayout({
	children,
}: { children: ReactNode }) {
	return (
		<div className="h-full bg-black-900">
			<div className="px-[40px] pb-[24px] flex-1 max-w-[1200px] mx-auto w-full flex divide-x divide-black-80">
				{/* Left Sidebar */}
				<div className="w-[240px] min-h-full flex flex-col pt-[24px]">
					{/* Menu Items */}
					<div className="flex flex-col space-y-4">
						<Link
							href="/settings/account"
							className="text-white-400 hover:text-white-100 text-[16px] font-hubot font-medium py-1"
						>
							Overview
						</Link>
						<Link
							href="/settings/account/general"
							className="text-black-70 hover:text-white-100 text-[16px] font-hubot font-medium py-1"
						>
							General
						</Link>
						<Link
							href="/settings/account/authentication"
							className="text-black-70 hover:text-white-100 text-[16px] font-hubot font-medium py-1"
						>
							Authentication
						</Link>
					</div>
				</div>

				{/* Main Content */}
				<div className="pl-[24px] flex-1 pt-[24px]">{children}</div>
			</div>
		</div>
	);
}
