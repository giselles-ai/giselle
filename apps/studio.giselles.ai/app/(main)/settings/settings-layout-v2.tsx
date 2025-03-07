import { UserIcon, UsersIcon } from "lucide-react";
import type { ReactNode } from "react";
import { IntegrationIcon } from "./components/integration-icon";
import { MenuLink } from "./components/menu-link";

export default async function SettingsLayoutV2({
	children,
}: { children: ReactNode }) {
	return (
		<div className="flex divide-x divide-black-80 h-full bg-black-850">
			<div className="w-[200px] p-[24px]">
				<div className="grid gap-[16px]">
					<MenuLink
						href="/settings/account"
						icon={<UserIcon className="w-4 h-4" />}
					>
						Account
					</MenuLink>
					<MenuLink
						href="/settings/integration"
						icon={<IntegrationIcon className="w-4 h-4" />}
					>
						Integration
					</MenuLink>
					<MenuLink
						href="/settings/team"
						icon={<UsersIcon className="w-4 h-4" />}
					>
						Team
					</MenuLink>
				</div>
			</div>
			<div className="px-[40px] py-[24px] flex-1">{children}</div>
		</div>
	);
}
