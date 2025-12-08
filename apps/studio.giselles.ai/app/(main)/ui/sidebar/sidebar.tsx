import {
	BlocksIcon,
	ChevronDownIcon,
	SettingsIcon,
	SparklesIcon,
} from "lucide-react";
import type { IconName } from "lucide-react/dynamic";
import { Accordion } from "radix-ui";
import { stageFlag } from "../../../../flags";
import { CreateAppButton } from "./create-app-button";
import { SidebarLink } from "./sidebar-link";

interface SidebarLinkGroupPart {
	type: "linkGroup";
	id: string;
	label: string;
	icon: IconName;
	links: SidebarLink[];
}

interface SidebarDividerPart {
	type: "divider";
	id: string;
}

type SidebarPart = SidebarLinkGroupPart | SidebarDividerPart;

function SidebarItem({ part }: { part: SidebarPart }) {
	switch (part.type) {
		case "divider":
			return <div className="bg-border/80 h-px mx-2 my-2" />;
		case "linkGroup":
			return (
				<Accordion.Item key={part.id} value={part.id} className="w-full">
					<Accordion.Trigger className="group w-full text-text-muted text-[13px] font-semibold px-2 pt-3 pb-3 flex items-center gap-2 hover:text-text transition-colors outline-none">
						{part.icon === "sparkle" && <SparklesIcon className="size-4" />}
						{part.icon === "blocks" && <BlocksIcon className="size-4" />}
						{part.icon === "settings" && <SettingsIcon className="size-4" />}

						<span className="flex-1 text-left">{part.label}</span>
						<ChevronDownIcon className="size-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
					</Accordion.Trigger>

					<Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
						{part.links.map((link) => (
							<SidebarLink key={link.id} {...link}>
								{link.label}
							</SidebarLink>
						))}
					</Accordion.Content>
				</Accordion.Item>
			);
		default: {
			const _exhaustiveCheck: never = part;
			throw new Error(`Unknown sidebar part type: ${_exhaustiveCheck}`);
		}
	}
}

const stagePart: SidebarPart = {
	type: "linkGroup",
	id: "stage",
	label: "Stage - Run Apps",
	icon: "sparkle",
	links: [
		{
			id: "playground",
			label: "Playground",
			href: "/playground",
			activeMatchPattern: "/playground",
		},
		{
			id: "apps",
			label: "Apps",
			href: "/stage/showcase",
			activeMatchPattern: "/stage/showcase",
		},
		{
			id: "tasks",
			label: "Task History",
			href: "/tasks",
			activeMatchPattern: "/tasks*",
		},
	],
};

const baseSidebarParts: SidebarPart[] = [
	{
		type: "linkGroup",
		id: "studio",
		label: "Studio - Build Apps",
		icon: "blocks",
		links: [
			{
				id: "workspaces",
				label: "Workspaces",
				href: "/workspaces",
				activeMatchPattern: "/workspaces*",
			},
			{
				id: "integration",
				label: "Integration",
				href: "/settings/team/integrations",
				activeMatchPattern: "/settings/team/integrations*",
			},
			{
				id: "vector-stores",
				label: "Vector Stores",
				href: "/settings/team/vector-stores",
				activeMatchPattern: "/settings/team/vector-stores*",
			},
		],
	},
	{ type: "divider", id: "divider1" },
	{
		type: "linkGroup",
		id: "manage",
		label: "Manage",
		icon: "settings",
		links: [
			{
				id: "member",
				label: "Member",
				href: "/settings/team/members",
				activeMatchPattern: "/settings/team/members*",
			},
			{
				id: "usage",
				label: "Usage",
				href: "/settings/team/usage",
				activeMatchPattern: "/settings/team/usage*",
			},
			{
				id: "team-settings",
				label: "Team Settings",
				href: "/settings/team",
				activeMatchPattern: [
					"/settings/team*",
					"!/settings/team/members*",
					"!/settings/team/integrations*",
					"!/settings/team/vector-stores*",
					"!/settings/team/usage*",
				],
			},
		],
	},
];

export async function Sidebar() {
	const isStageEnabled = await stageFlag();
	const sidebarParts = isStageEnabled
		? [stagePart, ...baseSidebarParts]
		: baseSidebarParts;

	return (
		<div className="w-[240px]">
			<div className="px-4">
				<div className="px-0 flex flex-col h-full">
					<div className="flex flex-col">
						<div className="px-1 pt-3 pb-3">
							<CreateAppButton />
						</div>

						<Accordion.Root
							type="multiple"
							className="w-full"
							defaultValue={sidebarParts.map((g) => g.id)}
						>
							{sidebarParts.map((sidebarPart) => (
								<SidebarItem part={sidebarPart} key={sidebarPart.id} />
							))}
						</Accordion.Root>
					</div>
				</div>
			</div>
		</div>
	);
}
