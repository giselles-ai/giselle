import { SearchInput } from "@giselle-internal/ui/search-input";
import { getAccountInfo } from "../settings/account/actions";
import { CreateWorkspaceButton } from "../workspaces/create-workspace-button";
import { LobbyClient } from "./lobby-client";

export default async function LobbyPage() {
	const accountInfo = await getAccountInfo();
	const username = accountInfo.displayName || accountInfo.email || "there";

	return (
		<div className="px-6 py-6 md:px-10 md:py-10 text-text">
			{/* Header */}
			<div className="mb-8 flex flex-col sm:flex-row sm:justify-end gap-3 items-center">
				<div className="flex items-center gap-3 w-full sm:w-auto">
					<div className="w-full sm:w-auto sm:max-w-lg">
						<SearchInput placeholder="App search" className="text-inverse" />
					</div>
					<div className="flex-shrink-0">
						<CreateWorkspaceButton />
					</div>
				</div>
			</div>

			<LobbyClient username={username} />
		</div>
	);
}
