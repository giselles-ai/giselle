import type { ActionNode } from "@giselle-sdk/data-type";
import { OutputId } from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { useState } from "react";
import { FetchActionConfiguredView } from "./ui/fetch-action-configured-view";

const formatOptions = [
	{ value: "markdown", label: "Markdown" },
	{ value: "links", label: "Links" },
	{ value: "html", label: "HTML" },
] as const;
type FormatType = (typeof formatOptions)[number]["value"];

const urlInputModes = [
	{
		value: "manual",
		label: "Manual Entry",
		description: "User types or pastes URLs directly",
	},
	{
		value: "node",
		label: "Node Output",
		description: "Use URLs coming from another node",
	},
] as const;
type UrlInputMode = (typeof urlInputModes)[number]["value"];

export function FetchActionPropertiesPanel({ node }: { node: ActionNode }) {
	const { updateNodeData } = useWorkflowDesigner();

	if (node.content.command.state.status === "configured") {
		return (
			<FetchActionConfiguredView
				nodeId={node.id}
				inputs={node.inputs}
				state={node.content.command.state}
			/>
		);
	}

	const [urlInputMode, setUrlInputMode] = useState<UrlInputMode>("manual");
	const [urls, setUrls] = useState<string>("");
	const [formats, setFormats] = useState<FormatType[]>(["markdown"]);
	const [error, setError] = useState<string | null>(null);

	const handleUrlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setUrls(e.target.value);
	};

	const handleFormatChange = (value: FormatType) => {
		setFormats((prev) =>
			prev.includes(value) ? prev.filter((f) => f !== value) : [...prev, value],
		);
	};

	const handleConfigure = () => {
		let urlList: string[] = [];
		if (urlInputMode === "manual") {
			urlList = urls
				.split("\n")
				.map((u) => u.trim())
				.filter((u) => u.length > 0);
			if (urlList.length === 0) {
				setError("Please enter at least one valid URL.");
				return;
			}
		}
		if (formats.length === 0) {
			setError("Please select at least one format.");
			return;
		}
		setError(null);
		updateNodeData(node, {
			content: {
				...node.content,
				command: {
					...node.content.command,
					provider: "fetch",
					state: {
						status: "configured",
						commandId: "fetch.websites",
						urls: urlList,
						formats,
						urlInputMode,
					},
				},
			},
			name: "Fetch Websites",
			outputs: [
				{
					id: OutputId.generate(),
					label: "output",
					accessor: "action-result",
				},
			],
		});
	};

	return (
		<div className="flex flex-col gap-4">
			<div>
				<fieldset className="flex flex-col border-0 p-0 m-0">
					<legend className="block font-medium mb-1">URL Input Mode</legend>
					<div className="flex flex-col gap-2">
						{urlInputModes.map((mode) => (
							<label key={mode.value} className="flex items-center gap-2">
								<input
									type="radio"
									name="url-input-mode"
									value={mode.value}
									checked={urlInputMode === mode.value}
									onChange={() => setUrlInputMode(mode.value)}
								/>
								<span className="font-medium">{mode.label}</span>
								<span className="text-gray-500 text-sm">
									{mode.description}
								</span>
							</label>
						))}
					</div>
				</fieldset>
			</div>
			{urlInputMode === "manual" ? (
				<div>
					<label htmlFor="fetch-action-urls" className="block font-medium mb-1">
						URLs (one per line)
					</label>
					<textarea
						id="fetch-action-urls"
						className="w-full border rounded p-2"
						rows={4}
						value={urls}
						onChange={handleUrlChange}
						placeholder="https://example.com"
					/>
				</div>
			) : null}
			<div>
				<fieldset className="flex flex-col border-0 p-0 m-0">
					<legend className="block font-medium mb-1">Output Formats</legend>
					<div className="flex flex-wrap gap-2">
						{formatOptions.map((option) => (
							<label key={option.value} className="flex items-center gap-1">
								<input
									type="checkbox"
									id={`fetch-action-format-${option.value}`}
									checked={formats.includes(option.value)}
									onChange={() => handleFormatChange(option.value)}
								/>
								<span>{option.label}</span>
							</label>
						))}
					</div>
				</fieldset>
			</div>
			{error && <div className="text-red-600 text-sm">{error}</div>}
			<button
				type="button"
				className="bg-blue-600 text-white rounded px-4 py-2 mt-2"
				onClick={handleConfigure}
			>
				Configure
			</button>
		</div>
	);
}
