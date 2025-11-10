import { SearchInput } from "@giselle-internal/ui/search-input";
import { getAccountInfo } from "../settings/account/actions";
import { LobbyClient } from "./lobby-client";

export default async function LobbyPage() {
	const accountInfo = await getAccountInfo();
	const username = accountInfo.displayName || accountInfo.email || "there";

	return (
		<div className="px-6 py-3 md:px-10 md:py-5 text-text">
			{/* Header */}
			<div className="mb-8 flex flex-col sm:flex-row sm:justify-between gap-3 items-center">
				{/* Text Banner */}
				<div className="w-full sm:flex-1 h-10 px-4 rounded-[8px] bg-blue-muted flex items-center justify-between gap-4">
					<div className="flex items-center gap-2 flex-1 min-w-0">
						<span className="text-sm text-gray-900 font-semibold whitespace-nowrap">
							Introducing Library
						</span>
						<span className="text-[12px] text-gray-900 whitespace-nowrap">
							Bring your docs, code, and files to collaborate with Giselle and
							your team.
						</span>
					</div>
					<span className="text-[12px] text-gray-900 underline whitespace-nowrap flex-shrink-0">
						More
					</span>
				</div>
				<div className="flex items-center gap-3 w-full sm:w-auto">
					<div className="w-full sm:w-auto sm:max-w-lg">
						<SearchInput
							placeholder="App search"
							className="text-inverse text-sm"
						/>
					</div>
				</div>
			</div>

			<LobbyClient username={username} />
		</div>
	);
}
