"use client";

import { WilliIcon } from "@giselle-internal/workflow-designer-ui";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDownIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import type { ActWithNavigation } from "../../tasks/types/index";

async function fetchActs(): Promise<ActWithNavigation[]> {
	const response = await fetch("/api/stage/acts");
	if (!response.ok) {
		return [];
	}
	return response.json();
}

export function SessionHistoryAccordion({
	variant,
}: {
	variant: "expanded" | "collapsed";
}) {
	const { data: acts = [], isLoading } = useSWR(
		"session-history-acts",
		fetchActs,
		{
			revalidateIfStale: false,
			revalidateOnFocus: false,
			revalidateOnReconnect: false,
		},
	);

	if (variant === "collapsed") {
		return (
			<Link
				href="/stage/acts"
				className="text-link-muted text-sm flex items-center py-0.5 hover:text-accent rounded-lg px-1"
			>
				<div className="size-8 flex items-center justify-center">
					<WilliIcon className="size-4" />
				</div>
			</Link>
		);
	}

	return (
		<Accordion.Root type="single" collapsible className="w-full">
			<Accordion.Item value="session-history" className="w-full">
				<Accordion.Trigger className="group w-full text-link-muted text-sm flex items-center py-0.5 hover:text-accent rounded-lg pl-1 pr-2 cursor-pointer outline-none">
					<div className="size-8 flex items-center justify-center">
						<WilliIcon className="size-4" />
					</div>
					<span className="flex-1 text-left">Session History</span>
					<ChevronDownIcon className="size-4 ml-auto transition-transform duration-200 group-data-[state=open]:rotate-180" />
				</Accordion.Trigger>
				<Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
					<div className="pl-6 pr-2 py-1">
						<Link
							href="/stage/tasks"
							className="block text-link-muted hover:text-accent text-xs py-1 px-1 rounded truncate"
						>
							Session all
						</Link>
					</div>
					{isLoading ? (
						<div className="pl-6 pr-2 py-1 text-text-muted text-xs flex items-center gap-2">
							<Loader2 className="size-3 animate-spin" />
							Loading...
						</div>
					) : acts.length === 0 ? (
						<div className="pl-6 pr-2 py-1 text-text-muted text-xs">
							No sessions found
						</div>
					) : (
						<div className="pl-6 pr-2 py-1">
							{acts.slice(0, 10).map((act) => (
								<Link
									key={act.id}
									href={act.link}
									className="block text-link-muted hover:text-accent text-xs py-1 px-1 rounded truncate"
								>
									{act.id}
								</Link>
							))}
						</div>
					)}
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>
	);
}
