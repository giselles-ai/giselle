import { SettingLabel } from "@giselle-internal/ui/setting-label";
import type { AppEntryNode, AppId } from "@giselles-ai/protocol";
import { useGiselle } from "@giselles-ai/react";
import useSWR from "swr";

export function AppEntryConfiguredView({
	node,
	appId,
}: {
	node: AppEntryNode;
	appId: AppId;
}) {
	const giselle = useGiselle();
	const { data, isLoading } = useSWR(`getApp/${appId}`, () =>
		giselle.getApp({ appId }),
	);

	if (isLoading) {
		return null;
	}

	if (data === undefined) {
		console.warn("App data is undefined");
		return null;
	}

	return (
		<div className="flex flex-col gap-[16px] p-0 px-1 overflow-y-auto">
			<p className="text-[14px] font-medium">{data.app.description}</p>

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
