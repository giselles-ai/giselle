import { settingsV2Flag } from "@/flags";
import type { ReactNode } from "react";
import { MenuLink } from "../components/v2/menu-link";

export default async function SettingsAccountLayout({
	children,
}: { children: ReactNode }) {
	const settingsV2Mode = await settingsV2Flag();
	if (!settingsV2Mode) {
		return <>{children}</>;
	}

	return (
		<>
			<div className="flex flex-col gap-y-4 w-[240px] p-[24px]">
				<div className="text-white-400 font-medium text-[12px] leading-[12px] font-hubot">
					Account Settings
				</div>
				<div className="grid gap-[4px]">
					<MenuLink href="/settings/account">Overview</MenuLink>
					<MenuLink href="/settings/account/general">General</MenuLink>
					<MenuLink href="/settings/account/authentication">
						Authentication
					</MenuLink>
				</div>
			</div>

			<div className="px-[40px] py-[24px] flex-1">{children}</div>
		</>
	);
}
