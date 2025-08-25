import type { ReactNode } from "react";
import { getAccountInfo } from "../(main)/settings/account/actions";
import { StageSidebar } from "./ui/stage-sidebar";

export default async function StageLayout({
	children,
}: {
	children: ReactNode;
}) {
	const accountInfo = await getAccountInfo();
	return (
		<div className="flex h-screen bg-black-900">
			<StageSidebar
				user={{
					displayName: accountInfo.displayName ?? undefined,
					email: accountInfo.email ?? undefined,
					avatarUrl: accountInfo.avatarUrl ?? undefined,
				}}
			/>
			<div className="flex-1 h-full overflow-hidden">{children}</div>
		</div>
	);
}
