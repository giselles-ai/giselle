import clsx from "clsx/lite";
import { useWorkflowDesigner } from "giselle-sdk/react";
import {
	DatabaseIcon,
	DraftingCompassIcon,
	FileKey2Icon,
	HistoryIcon,
} from "lucide-react";
import Link from "next/link";
import { Tabs } from "radix-ui";
import { useCallback } from "react";
import { GiselleLogo } from "../../icons";
import { EditableText } from "../properties-panel/ui";

export function SideMenu() {
	const { updateName, data } = useWorkflowDesigner();
	const handleChange = useCallback(
		(value?: string) => {
			if (!value) {
				return;
			}
			updateName(value);
		},
		[updateName],
	);
	return (
		<div className="px-[8px] flex flex-col gap-[16px]">
			<Link href="/">
				<GiselleLogo className="fill-white-900 w-[70px] h-auto mt-[6px]" />
			</Link>

			<EditableText
				fallbackValue="Untitled"
				onChange={handleChange}
				value={data.name}
				size="large"
			/>
			<Tabs.List
				className={clsx(
					"flex flex-col w-full text-white-800 text-[14px]",
					"**:data-list-wrapper:py-[1px] **:data-list-wrapper:cursor-pointer ",
					"**:data-list:flex **:data-list:items-center **:data-list:gap-[4px] **:data-list:px-[8px]",
					"**:data-list:py-[4px] **:data-list:rounded-[2px]",
					"**:data-list:group-hover:bg-black-400/40",
					"**:data-list:transition-colors",
					"**:data-list:group-data-[state=active]:bg-black-750",
					"**:data-list:group",
					"**:data-icon:size-[16px] **:data-icon:shrink-0 **:data-icon:text-white-400",
					"**:data-icon:group-hover:text-white-800",
					"**:data-icon:transition-colors",
				)}
			>
				<Tabs.Trigger value="builder" className="group" data-list-wrapper>
					<div data-list>
						<DraftingCompassIcon data-icon />
						<p>Builder</p>
					</div>
				</Tabs.Trigger>
				<Tabs.Trigger value="run-history" className="group" data-list-wrapper>
					<div data-list>
						<HistoryIcon data-icon />
						<p>Run History</p>
					</div>
				</Tabs.Trigger>
				<Tabs.Trigger value="secret" className="group" data-list-wrapper>
					<div data-list>
						<FileKey2Icon data-icon />
						<p>Secrets</p>
					</div>
				</Tabs.Trigger>
				<Tabs.Trigger value="datasource" className="group" data-list-wrapper>
					<div data-list>
						<DatabaseIcon data-icon />
						<p>Data Source</p>
					</div>
				</Tabs.Trigger>
			</Tabs.List>
		</div>
	);
}
