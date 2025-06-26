import fs from "node:fs";
import path from "node:path";
import { NavLink } from "./nav-link";

function loadComponents() {
	const uiDir = path.join(process.cwd(), "app/ui");
	const entries = fs.readdirSync(uiDir, { withFileTypes: true });

	return entries
		.filter((entry) => entry.isDirectory())
		.map((entry) => ({
			id: entry.name,
			name: entry.name.charAt(0).toUpperCase() + entry.name.slice(1),
		}))
		.sort((a, b) => a.name.localeCompare(b.name));
}

const components = loadComponents();
export default function ({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen bg-surface-background font-mono">
			<div className="flex">
				<div className="w-64 border-r border-border min-h-screen">
					<div className="p-6">
						<h1 className="text-text mb-6">Components</h1>
						<nav className="gap-1 flex flex-col">
							{components.map((component) => (
								<NavLink key={component.id} pathname={`/ui/${component.id}`}>
									{component.name}
								</NavLink>
							))}
						</nav>
					</div>
				</div>

				<div className="flex-1 p-8">
					<main className="max-w-4xl">{children}</main>
				</div>
			</div>
		</div>
	);
}
