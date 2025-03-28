import { settingsV2Flag } from "@/flags";
import type { ReactNode } from "react";
import { MenuLink } from "../components/v2/menu-link";

export default async function SettingsTeamLayout({
	children,
}: { children: ReactNode }) {
	const settingsV2Mode = await settingsV2Flag();
	if (!settingsV2Mode) {
		return <>{children}</>;
	}

	return (
		<>
			<div className="flex flex-col gap-y-4 w-[300px] p-[24px]">
				<div className="text-white-400 font-medium text-[12px] leading-[12px] font-hubot">
					Team Settings
				</div>
				<div className="grid gap-[4px]">
					<MenuLink href="/settings/team">General</MenuLink>
					<MenuLink href="/settings/team/usage">Usage</MenuLink>
					<MenuLink href="/settings/team/members">Members</MenuLink>
					<MenuLink href="/settings/team/integrations">Integrations</MenuLink>
					<MenuLink href="/settings/team/billing">Billing</MenuLink>
				</div>
			</div>

			<div className="px-[40px] py-[24px] flex-1">{children}</div>
		</>
	);
}
