import type { ReactNode } from "react";
import { SidebarMenu } from "./sidebar-menu";

export default function SettingsAccountLayout({
	children,
}: {
	children: ReactNode;
}) {
	return (
		<div className="h-full bg-black-900">
			<div className="flex-1 max-w-[1200px] w-full flex min-h-[calc(100vh-64px)] pl-[40px]">
				{/* Left Sidebar with border */}
				<div className="border-r border-black-70/50 pr-6">
					<div className="sticky top-[64px]">
						<SidebarMenu />
					</div>
				</div>
				{/* Main Content */}
				<div className="pl-[24px] flex-1 pt-[24px]">{children}</div>
			</div>
		</div>
	);
}
