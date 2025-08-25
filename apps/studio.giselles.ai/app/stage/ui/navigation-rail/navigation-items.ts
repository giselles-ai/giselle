import { WilliIcon } from "@giselle-internal/workflow-designer-ui";
import { LibraryIcon, SparklesIcon } from "lucide-react";

interface LinkNavigationItem {
	id: string;
	type: "link";
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	label: string;
	href: string;
	isActive?: (pathname: string) => boolean;
}

export type NavigationItem = LinkNavigationItem;

export const navigationItems = [
	{
		id: "new-task-link",
		type: "link",
		icon: SparklesIcon,
		label: "New task",
		href: "/stage",
	},
	{
		id: "showcase-link",
		type: "link",
		icon: LibraryIcon,
		label: "Showcase",
		href: "/stage/showcase",
		isActive: (pathname: string) => pathname === "/stage/showcase",
	},
	{
		id: "tasks-link",
		type: "link",
		icon: WilliIcon,
		label: "Tasks",
		href: "/stage/acts",
		isActive: (pathname: string) => pathname.startsWith("/stage/acts"),
	},
] satisfies NavigationItem[];
