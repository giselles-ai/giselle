import { WilliIcon } from "@giselle-internal/workflow-designer-ui";
import {
	Activity,
	Blocks,
	Bolt,
	LibraryIcon,
	Play,
	Puzzle,
	Settings,
	SparklesIcon,
	SquareLibrary,
	Workflow,
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
	icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	collapsible?: boolean;
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
	// Stage - Run Apps
	{
		id: "section-agent",
		type: "section",
		label: "Stage - Run Apps",
		icon: SparklesIcon,
		collapsible: true,
	},
	{
		id: "nav-stage",
		type: "link",
		icon: Play,
		label: "Playground",
		href: "/playground",
	},
	{
		id: "nav-showcase",
		type: "link",
		icon: LibraryIcon,
		label: "Apps",
		href: "/stage/showcase",
		isActive: (p: string) => p === "/stage/showcase",
	},
	{
		id: "nav-task",
		type: "link",
		icon: WilliIcon,
		label: "Session History",
		href: "/stage/acts",
		isActive: (p: string) => p.startsWith("/stage/acts"),
	},
	// Studio - Build Apps
	{
		id: "section-studio",
		type: "section",
		label: "Studio - Build Apps",
		icon: Blocks,
		collapsible: true,
	},
	{
		id: "nav-studio",
		type: "link",
		icon: Workflow,
		label: "Workspaces",
		href: "/workspaces",
		isActive: (p: string) => p.startsWith("/workspaces"),
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
		label: "Vector Stores",
		href: "/settings/team/vector-stores",
		isActive: (p: string) => p.startsWith("/settings/team/vector-stores"),
	},
	{ id: "divider-2", type: "divider" },
	// Manage
	{
		id: "section-manage",
		type: "section",
		label: "Manage",
		icon: Settings,
		collapsible: true,
	},
	{
		id: "nav-member",
		type: "link",
		icon: MemberIcon,
		label: "Member",
		href: "/settings/team/members",
		isActive: (p: string) => p.startsWith("/settings/team/members"),
	},
	{
		id: "nav-usage",
		type: "link",
		icon: Activity,
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
] satisfies NavigationItem[];

export const navigationItemsFooter: NavigationItem[] = [];
