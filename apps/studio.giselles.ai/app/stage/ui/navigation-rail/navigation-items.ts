import { WilliIcon } from "@giselle-internal/workflow-designer-ui";
import {
	Blocks,
	Bolt,
	BookMarked,
	Crown,
	Globe,
	LibraryIcon,
	Megaphone,
	Puzzle,
	SparklesIcon,
	SquareLibrary,
} from "lucide-react";
import { MemberIcon } from "./icons/member";

interface LinkNavigationItem {
	id: string;
	type: "link";
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	label: string;
	href: string;
	isActive?: (pathname: string) => boolean;
}

interface ExternalNavigationItem {
	id: string;
	type: "external";
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	label: string;
	href: string;
}

interface SectionNavigationItem {
	id: string;
	type: "section";
	label: string;
}

interface DividerNavigationItem {
	id: string;
	type: "divider";
}

interface ActionNavigationItem {
	id: string;
	type: "action";
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	label: string;
}

interface SubMenuNavigationItem {
	id: string;
	type: "submenu";
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	label: string;
	items: Array<{
		label: string;
		href: string;
		external: boolean;
		disabled: boolean;
	}>;
}

export type NavigationItem =
	| LinkNavigationItem
	| ExternalNavigationItem
	| SectionNavigationItem
	| DividerNavigationItem
	| ActionNavigationItem
	| SubMenuNavigationItem;

export const navigationItems = [
	// Agent
	{ id: "section-agent", type: "section", label: "Agent" },
	{
		id: "nav-stage",
		type: "link",
		icon: SparklesIcon,
		label: "Stage",
		href: "/stage",
	},
	{
		id: "nav-studio",
		type: "link",
		icon: Blocks,
		label: "Workspace Studio",
		href: "/workspaces",
		isActive: (p: string) => p.startsWith("/workspaces"),
	},
	{
		id: "nav-showcase",
		type: "link",
		icon: LibraryIcon,
		label: "App Showcase",
		href: "/stage/showcase",
		isActive: (p: string) => p === "/stage/showcase",
	},
	{
		id: "nav-task",
		type: "link",
		icon: WilliIcon,
		label: "Job",
		href: "/stage/acts",
		isActive: (p: string) => p.startsWith("/stage/acts"),
	},
	{ id: "divider-1", type: "divider" },
	// Manage
	{ id: "section-manage", type: "section", label: "Manage" },
	{
		id: "nav-member",
		type: "link",
		icon: MemberIcon,
		label: "Member",
		href: "/settings/team/members",
		isActive: (p: string) => p.startsWith("/settings/team/members"),
	},
	{
		id: "nav-integration",
		type: "link",
		icon: Puzzle,
		label: "Integration",
		href: "/settings/team/integrations",
		isActive: (p: string) => p.startsWith("/settings/team/integrations"),
	},
	{
		id: "nav-vector-stores",
		type: "link",
		icon: SquareLibrary,
		label: "Vector stores",
		href: "/settings/team/vector-stores",
		isActive: (p: string) => p.startsWith("/settings/team/vector-stores"),
	},
	{
		id: "nav-usage",
		type: "link",
		icon: SparklesIcon,
		label: "Usage",
		href: "/settings/team/usage",
		isActive: (p: string) => p.startsWith("/settings/team/usage"),
	},
	{
		id: "nav-team-settings",
		type: "link",
		icon: Bolt,
		label: "Team Settings",
		href: "/settings/team",
		isActive: (p: string) =>
			p.startsWith("/settings/team") &&
			!p.includes("/members") &&
			!p.includes("/integrations") &&
			!p.includes("/vector-stores") &&
			!p.includes("/usage"),
	},
	{ id: "divider-2", type: "divider" },
	// Upgrade button
	{ id: "nav-upgrade", type: "action", icon: Crown, label: "Upgrade" },
	// Spacer section above Docs
	{ id: "section-others", type: "section", label: "" },
	// Others
	{
		id: "nav-whats-new",
		type: "external",
		icon: Megaphone,
		label: "Whats new",
		href: "https://docs.giselles.ai/en/releases/release-notes",
	},
	{
		id: "nav-more",
		type: "submenu",
		icon: Globe,
		label: "More from Giselle",
		items: [
			{
				label: "Blog",
				href: "https://giselles.ai/blog",
				external: true,
				disabled: false,
			},
			{
				label: "Career",
				href: "",
				external: false,
				disabled: true,
			},
			{
				label: "Feedback",
				href: "",
				external: false,
				disabled: true,
			},
		],
	},
] satisfies NavigationItem[];
