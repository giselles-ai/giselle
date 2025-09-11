import { WilliIcon } from "@giselle-internal/workflow-designer-ui";
import { LibraryIcon, MegaphoneIcon, SparklesIcon } from "lucide-react";

interface LinkNavigationItem {
	id: string;
	type: "link";
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	label: string;
	href: string;
	isActive?: (pathname: string) => boolean;
}

interface NotificationNavigationItem {
	id: string;
	type: "notification";
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	label: string;
	onClick: () => void;
}

export type NavigationItem = LinkNavigationItem | NotificationNavigationItem;

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
	{
		id: "updates-notification",
		type: "notification",
		icon: MegaphoneIcon,
		label: "Updates",
		onClick: () => {},
	},
] satisfies NavigationItem[];
