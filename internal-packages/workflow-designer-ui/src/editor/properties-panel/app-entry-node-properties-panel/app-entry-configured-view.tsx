import { SettingLabel } from "@giselle-internal/ui/setting-label";
import type { AppEntryNode } from "@giselles-ai/protocol";

export function AppEntryConfiguredView({ node }: { node: AppEntryNode }) {
	if (node.content.status !== "configured") {
		return null;
	}

	// TODO: Fetch app data from API using node.content.appId
	// For now, we'll show a placeholder
	// const appPromise = client.getApp({ appId: node.content.appId });
	// const app = use(appPromise);

	return (
		<div className="flex flex-col gap-[16px] p-0 px-1 overflow-y-auto">
			<div className="space-y-[4px]">
				<SettingLabel className="py-[1.5px]">App</SettingLabel>
				<div className="px-[4px] py-0 w-full bg-transparent text-[14px] mt-[8px]">
					<div className="flex items-center gap-[8px]">
						<span className="text-[14px] font-medium">
							{node.name ?? "Unnamed App"}
						</span>
					</div>
				</div>
			</div>

			{node.outputs.length > 0 && (
				<div className="space-y-[4px]">
					<SettingLabel className="py-[1.5px]">Output Parameters</SettingLabel>
					<div className="px-[4px] py-0 w-full bg-transparent text-[14px] mt-[8px]">
						<ul className="w-full flex flex-col gap-[12px]">
							{node.outputs.map((output) => (
								<li key={output.id}>
									<div className="flex items-center gap-[8px]">
										<span className="text-[14px]">{output.label}</span>
									</div>
								</li>
							))}
						</ul>
					</div>
				</div>
			)}
		</div>
	);
}
