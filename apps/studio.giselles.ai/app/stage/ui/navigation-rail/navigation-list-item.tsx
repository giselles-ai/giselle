import { UpdateNotificationButton } from "@giselle-internal/workflow-designer-ui";
import Link from "next/link";
import type { NavigationItem } from "./navigation-items";
import type { NavigationRailState } from "./types";

export function NavigationListItem(
	props: NavigationItem & { variant: NavigationRailState },
) {
	if (props.type === "link") {
		return (
			<Link
				href={props.href}
				className="text-text-muted text-sm flex items-center py-0.5 hover:bg-ghost-element-hover rounded-lg px-1"
			>
				<div className="size-8 flex items-center justify-center">
					<props.icon className="size-4" />
				</div>
				{props.variant === "expanded" && props.label}
			</Link>
		);
	}

	if (props.type === "notification") {
		return (
			<button
				type="button"
				onClick={(e) => {
					const updateButton = e.currentTarget.querySelector("button");
					if (updateButton) {
						updateButton.click();
					}
				}}
				className="text-text-muted text-sm flex items-center py-0.5 hover:bg-ghost-element-hover rounded-lg px-1 w-full text-left"
			>
				<div className="size-8 flex items-center justify-center">
					<UpdateNotificationButton />
				</div>
				{props.variant === "expanded" && props.label}
			</button>
		);
	}

	// This should never be reached if NavigationItem is properly typed
	const _exhaustiveCheck: never = props;
	throw new Error(`Unhandled navigation item type`);
}
