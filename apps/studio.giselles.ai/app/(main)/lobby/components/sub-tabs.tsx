interface SubTabsProps {
	tabs: string[];
	activeTab: string;
	onTabChange: (tab: string) => void;
}

export function SubTabs({ tabs, activeTab, onTabChange }: SubTabsProps) {
	return (
		<div className="mb-4">
			<div className="flex items-center gap-4">
				{tabs.map((tab) => {
					const isActive = activeTab === tab;
					return (
						<button
							key={tab}
							type="button"
							onClick={() => onTabChange(tab)}
							className={`text-base font-semibold transition-colors ${
								isActive ? "text-inverse" : "text-text/60"
							}`}
						>
							{tab}
						</button>
					);
				})}
			</div>
		</div>
	);
}
