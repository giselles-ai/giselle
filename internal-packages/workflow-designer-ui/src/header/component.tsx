"use client";

import clsx from "clsx";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { PlayIcon } from "lucide-react";
import type { ReactNode } from "react";
import { EditableText } from "../editor/properties-panel/ui";
import { GiselleLogo } from "../icons";

export function Header({
	action,
}: {
	action?: ReactNode;
}) {
	const { data, updateName } = useWorkflowDesigner();
	return (
		<div className="h-[54px] pl-[24px] pr-[16px] flex items-center justify-between shrink-0">
			<div className="flex items-center gap-[8px] text-white-950">
				<GiselleLogo className="fill-white-900 w-[70px] h-auto mt-[6px]" />
				<Divider />
				<EditableText
					fallbackValue="Untitled"
					onChange={updateName}
					value={data.name}
				/>
			</div>
			{action && <div className="flex items-center">{action}</div>}
		</div>
	);
}

function Divider() {
	return <div className="text-[24px] font-[250]">/</div>;
}

export function RunButton({
	onClick,
}: {
	onClick?: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={clsx(
				"flex py-[8px] px-[16px] justify-center items-center gap-[4px]",
				"rounded-[8px]",
				"bg-primary-900 text-[14px] text-white-900",
				"cursor-pointer",
			)}
		>
			<PlayIcon className="size-[16px] fill-white-900" />
			<p>Run</p>
		</button>
	);
}
