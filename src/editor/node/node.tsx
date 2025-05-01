// GitHubトリガーノードか確認する
const isGitHubTriggerNode = 
	node.type === "action" && 
	node.content.type === "trigger" && 
	(node.content.provider as any).type === "github";

// 選択状態でGitHubノードの場合、リポジトリ情報を表示
const showRepositoryInfo = isGitHubTriggerNode && githubAuthState === 'installed';
		
return (
	<div
		data-type={node.type}
		data-content-type={node.content.type}
		data-selected={selected}
		data-preview={preview}
		className={clsx(
			"group relative flex flex-col rounded-[16px] py-[16px] gap-[16px] min-w-[180px]",
			"bg-gradient-to-tl transition-all backdrop-blur-[4px]",
			"data-[content-type=text]:from-text-node-1] data-[content-type=text]:to-text-node-2 data-[content-type=text]:shadow-text-node-1",
			"data-[content-type=file]:from-file-node-1] data-[content-type=file]:to-file-node-2 data-[content-type=file]:shadow-file-node-1",
			"data-[content-type=textGeneration]:from-generation-node-1] data-[content-type=textGeneration]:to-generation-node-2 data-[content-type=textGeneration]:shadow-generation-node-1",
			"data-[content-type=imageGeneration]:from-image-generation-node-1] data-[content-type=imageGeneration]:to-image-generation-node-2 data-[content-type=imageGeneration]:shadow-image-generation-node-1",
			"data-[content-type=github]:from-github-node-1] data-[content-type=github]:to-github-node-2 data-[content-type=github]:shadow-github-node-1",
			"data-[content-type=webSearch]:from-web-search-node-1] data-[content-type=webSearch]:to-web-search-node-2 data-[content-type=webSearch]:shadow-web-search-node-1",
			"data-[content-type=audioGeneration]:from-audio-generation-node-1] data-[content-type=audioGeneration]:to-audio-generation-node-2 data-[content-type=audioGeneration]:shadow-audio-generation-node-1",
			"data-[content-type=videoGeneration]:from-video-generation-node-1] data-[content-type=videoGeneration]:to-video-generation-node-2 data-[content-type=videoGeneration]:shadow-video-generation-node-1",
			"data-[content-type=trigger]:from-trigger-node-1] data-[content-type=trigger]:to-trigger-node-2 data-[content-type=trigger]:shadow-trigger-node-1",
			"data-[content-type=trigger]:border-[1px] data-[content-type=trigger]:border-solid data-[content-type=trigger]:border-black-400 data-[content-type=trigger]:bg-black-400-20 data-[content-type=trigger]:backdrop-blur-[2px]",
			"data-[selected=true]:shadow-[0px_0px_16px_0px]",
			"data-[preview=true]:opacity-50",
			"not-data-preview:min-h-[110px]",
		)}
	>
		{/* ... existing code ... */}

		<div className={clsx("px-[16px] relative")}>
			<div className="flex items-center gap-[8px]">
				<div
					className={clsx(
						"w-[32px] h-[32px] flex items-center justify-center rounded-[8px] padding-[8px]",
						"group-data-[content-type=text]:bg-text-node-1",
						"group-data-[content-type=file]:bg-file-node-1",
						"group-data-[content-type=textGeneration]:bg-generation-node-1",
						"group-data-[content-type=imageGeneration]:bg-image-generation-node-1",
						"group-data-[content-type=github]:bg-github-node-1",
						"group-data-[content-type=webSearch]:bg-web-search-node-1",
						"group-data-[content-type=audioGeneration]:bg-audio-generation-node-1",
						"group-data-[content-type=videoGeneration]:bg-video-generation-node-1",
						"group-data-[content-type=trigger]:bg-black-400",
					)}
				>
					<NodeIcon
						node={node}
						className={clsx(
							"w-[16px] h-[16px] fill-current",
							"group-data-[content-type=text]:text-black-900",
							"group-data-[content-type=file]:text-black-900",
							"group-data-[content-type=textGeneration]:text-white-900",
							"group-data-[content-type=imageGeneration]:text-white-900",
							"group-data-[content-type=github]:text-white-900",
							"group-data-[content-type=webSearch]:text-white-900",
							"group-data-[content-type=audioGeneration]:text-white-900",
							"group-data-[content-type=videoGeneration]:text-white-900",
							"group-data-[content-type=trigger]:text-white-900",
						)}
					/>
				</div>
				<div>
					<EditableText
						className="group-data-[selected=false]:pointer-events-none **:data-input:w-full"
						text={defaultName(node)}
						onValueChange={(value) => {
							if (value === defaultName(node)) {
								return;
							}
							if (value.trim().length === 0) {
								updateNodeData(node, { name: undefined });
								return;
							}
							updateNodeData(node, { name: value });
						}}
						onClickToEditMode={(e) => {
							if (!selected) {
								e.preventDefault();
								return;
							}
							e.stopPropagation();
						}}
					/>
					{node.type === "action" &&
						(node.content.type === "imageGeneration" ||
							node.content.type === "textGeneration") && (
							<div className="text-[10px] text-white-400 pl-[4px]">
								{node.content.llm.provider}
							</div>
						)}
				</div>
			</div>
		</div>

		{/* リポジトリ情報表示 - Selected状態でGitHubトリガーノードの場合 */}
		{showRepositoryInfo && (
			<div className="mx-4 px-3 py-2 bg-black-800/40 rounded-lg border border-white-900/10">
				<div className="flex items-center gap-2 mb-2">
					<svg className="w-4 h-4 text-white-900" viewBox="0 0 24 24" fill="currentColor">
						<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
					</svg>
					<span className="text-[12px] font-medium text-white-900">route06/giselle-service-website</span>
				</div>
				<div className="flex items-start gap-2 border-t border-white-900/10 pt-2">
					<svg className="w-4 h-4 text-white-900 mt-[2px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
						<path d="M6 6l6 6l6-6" />
						<path d="M12 12v6" />
					</svg>
					<div className="text-[11px] text-white-400">
						<div>Merge pull request #1169 from</div>
						<div className="text-white-900">route06/deep-learning</div>
					</div>
				</div>
			</div>
		)}

		{!preview && (
			<div className="flex justify-between">
			// ... rest of the code ...
		</div>
	)
} 