import type {
	FetchActionCommandConfiguredState,
	Input,
	NodeId,
} from "@giselle-sdk/data-type";

export function FetchActionConfiguredView({
	state,
}: {
	nodeId: NodeId;
	inputs: Input[];
	state: FetchActionCommandConfiguredState;
}) {
	return (
		<div className="flex flex-col gap-[17px] p-0">
			<div className="space-y-[4px]">
				<p className="text-[14px] py-[1.5px] text-white-400">URL Input Mode</p>
				<div className="px-[12px] pt-[6px]">
					<span className="p-2 bg-black-900 text-white-800 text-[14px] rounded">
						{state.urlInputMode === "manual" ? "Manual Entry" : "Node Output"}
					</span>
				</div>
			</div>

			<div className="space-y-[4px]">
				<p className="text-[14px] py-[1.5px] text-white-400">URLs</p>
				<div className="px-[12px] pt-[6px]">
					{state.urlInputMode === "node" ? (
						<div className="text-gray-500 italic p-2 border rounded bg-gray-50">
							URLs are provided from another node output. The URLs for this
							fetch action will be taken from the output of the node connected
							to this node's input.
						</div>
					) : (
						<div className="p-2 bg-black-900 text-white-800 text-[14px] whitespace-pre-line">
							{state.urls.join("\n")}
						</div>
					)}
				</div>
			</div>

			<div className="space-y-[4px]">
				<p className="text-[14px] py-[1.5px] text-white-400">Output Formats</p>
				<div className="px-[16px] py-[9px] w-full bg-transparent text-[14px] flex gap-2 flex-wrap">
					{state.formats.map((format) => (
						<span
							key={format}
							className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-400"
						>
							{format}
						</span>
					))}
				</div>
			</div>
		</div>
	);
}
