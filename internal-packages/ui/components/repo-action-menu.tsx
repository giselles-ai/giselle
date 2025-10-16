import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import clsx from "clsx/lite";
import { Ellipsis } from "lucide-react";
import { memo } from "react";
import { GlassSurfaceLayers } from "./glass-surface";

export type RepoAction = {
	value: string | number;
	label: string;
	icon?: React.ReactNode;
	disabled?: boolean;
	onSelect?: () => void;
	destructive?: boolean;
};

export const RepoActionMenu = memo(function RepoActionMenu({
	actions,
	id,
	disabled,
}: {
	actions: RepoAction[];
	id?: string;
	disabled?: boolean;
}) {
	return (
		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild>
				<button
					id={id}
					type="button"
					disabled={disabled}
					className={clsx(
						"p-0 h-6 w-6 rounded-md mr-1 inline-flex items-center justify-center",
						"outline-none focus:outline-none focus-visible:outline-none focus:ring-0",
						disabled ? "opacity-50 cursor-not-allowed" : undefined,
					)}
					aria-label="Actions"
				>
					<Ellipsis className="text-inverse/70" />
				</button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenu.Content
					sideOffset={4}
					className={clsx(
						"relative z-50 min-w-[165px] overflow-hidden rounded-[12px] p-1 text-text shadow-md",
					)}
				>
					<GlassSurfaceLayers tone="default" borderStyle="solid" />
					{actions.map((action) => (
						<DropdownMenu.Item
							key={action.value}
							disabled={action.disabled}
							onSelect={(e) => {
								if (!action.disabled) action.onSelect?.();
							}}
							className={clsx(
								"rounded-md px-3 py-2 text-[14px] font-medium outline-none",
								"data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed",
								action.destructive
									? "text-error-900 hover:bg-error-900/20"
									: "text-text hover:bg-white/5",
								"cursor-pointer",
							)}
						>
							<span className="inline-flex items-center gap-2">
								{action.icon ? (
									<span className="h-4 w-4">{action.icon}</span>
								) : null}
								{action.label}
							</span>
						</DropdownMenu.Item>
					))}
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	);
});
