import { githubIntegrationFlag } from "@/flags";
import { CreditCardIcon, UserIcon } from "lucide-react";
import type { ReactNode } from "react";
import { IntegrationIcon } from "./components/integration-icon";
import { MenuLink } from "./components/menu-link";

export default async function SettingLayout({
	children,
}: { children: ReactNode }) {
	const displayGitHubIntegration = await githubIntegrationFlag();
	return (
		<div className="flex divide-x divide-black-80 h-full">
			<div className="w-[200px] p-[24px]">
				<div className="grid gap-[16px]">
					{/**<h3 className="px-[16px] text-[14px] font-rosart text-black-30">
						Account
					</h3>**/}
					<MenuLink
						href="/settings/account"
						icon={<UserIcon className="w-4 h-4" />}
					>
						Account
					</MenuLink>
					{displayGitHubIntegration && (
						<MenuLink
							href="/settings/integration"
							icon={<IntegrationIcon className="w-4 h-4" />}
						>
							Integration
						</MenuLink>
					)}
					<MenuLink
						href="/settings/billing"
						icon={<CreditCardIcon className="w-4 h-4" />}
					>
						Billing
					</MenuLink>
				</div>
			</div>
			<div className="px-[48px] py-[32px] flex-1">{children}</div>
		</div>
	);
}
