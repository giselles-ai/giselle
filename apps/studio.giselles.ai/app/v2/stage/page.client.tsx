import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { use } from "react";
import type { LoaderData } from "./data-loader";

interface App {
	id: string;
	name: string;
	description: string;
	iconName: IconName;
}

const yourApps: App[] = [
	{
		id: "blog-writer",
		name: "Blog Writer",
		description: "Generate engaging blog posts with AI assistance",
		iconName: "file",
	},
	{
		id: "image-generator",
		name: "Image Generator",
		description: "Create stunning visuals from text descriptions",
		iconName: "image",
	},
	{
		id: "social-post",
		name: "Social Post Creator",
		description: "Craft perfect social media posts",
		iconName: "message-circle",
	},
];

const suggestedApps: App[] = [
	{
		id: "data-analyzer",
		name: "Data Analyzer",
		description: "Extract insights from your data",
		iconName: "chart-bar",
	},
	{
		id: "email-writer",
		name: "Email Writer",
		description: "Compose professional emails",
		iconName: "mail",
	},
	{
		id: "code-reviewer",
		name: "Code Reviewer",
		description: "Review and improve code quality",
		iconName: "code",
	},
	{
		id: "research-assistant",
		name: "Research Assistant",
		description: "Deep research and analysis",
		iconName: "brain",
	},
	{
		id: "creative-brainstorm",
		name: "Creative Brainstorm",
		description: "Generate creative ideas",
		iconName: "sparkles",
	},
];

function AppCard({
	name,
	description,
	iconName,
	onClick,
}: App & {
	onClick?: React.MouseEventHandler;
}) {
	return (
		<button
			onClick={onClick}
			className="w-full flex items-start gap-4 p-4 rounded-lg border border-border hover:border-border-muted transition-all text-left group cursor-pointer h-[100px]"
			type="button"
		>
			<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br">
				<DynamicIcon name={iconName} className="h-6 w-6 text-white" />
			</div>
			<div className="flex-1 min-w-0">
				<h3 className="text-base font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
					{name}
				</h3>
				<p className="text-sm text-muted-foreground line-clamp-2">
					{description}
				</p>
			</div>
		</button>
	);
}
export function Page({ dataLoader }: { dataLoader: Promise<LoaderData> }) {
	const _data = use(dataLoader);
	return (
		<div className="max-w-7xl mx-auto px-8 py-12">
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Your apps */}
				<div>
					<h2 className="text-2xl font-semibold text-foreground mb-6">
						Your apps
					</h2>
					<div className="space-y-3">
						{yourApps.map((app) => (
							<AppCard {...app} key={app.id} />
						))}
					</div>
				</div>
				{/* Your apps */}

				{/* Suggested apps */}
				<div>
					<h2 className="text-2xl font-semibold text-foreground mb-6">
						Suggested apps
					</h2>
					<div className="space-y-3">
						{suggestedApps.map((app) => (
							<AppCard {...app} key={app.id} />
						))}
					</div>
				</div>
				{/* Suggested apps */}
			</div>
		</div>
	);
}
