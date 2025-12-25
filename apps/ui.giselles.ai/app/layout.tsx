import { DM_Mono, DM_Sans } from "next/font/google";
import { NavLink } from "./nav-link";
import "./globals.css";

const components = [
	{
		id: "button",
		name: "Button",
	},
	{
		id: "input",
		name: "Input",
	},
	{
		id: "dialog",
		name: "Dialog",
	},
	{
		id: "select",
		name: "Select",
	},
	{
		id: "dropdown-menu",
		name: "Dropdown Menu",
	},
	{
		id: "popover",
		name: "Popover",
	},
	{
		id: "toggle",
		name: "Toggle",
	},
	{
		id: "table",
		name: "Table",
	},
	{
		id: "toast",
		name: "Toast",
	},
	{
		id: "status-badge",
		name: "Status Badge",
	},
];

const dmSans = DM_Sans({
	weight: "variable",
	variable: "--font-dm-sans",
	subsets: ["latin"],
});

const dmMono = DM_Mono({
	weight: ["300", "500"],
	variable: "--font-dm-mono",
	subsets: ["latin"],
});

export default function ({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className={`${dmSans.variable} ${dmMono.variable}`}>
			<body>
				<div className="min-h-screen bg-bg font-sans">
					<div className="flex">
						<div className="w-64 border-r border-border min-h-screen">
							<div className="p-6">
								<h1 className="text-text mb-6">Components</h1>
								<nav className="gap-1 flex flex-col">
									{components.map((component) => (
										<NavLink key={component.id} pathname={`/${component.id}`}>
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
			</body>
		</html>
	);
}
