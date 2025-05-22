"use client";

import type { Node } from "@giselle-sdk/data-type";
import { defaultName } from "@giselle-sdk/node-utils";
import type { ReactNode } from "react";
import { EditableText } from "../../../ui/editable-text";

export function PropertiesPanelRoot({
	children,
}: {
	children: ReactNode;
}) {
	return (
		<div className="h-full w-full flex flex-col gap-[8px] overflow-hidden">
			{children}
		</div>
	);
}

export function PropertiesPanelHeader({
	node,
	description,
	icon,
	onChangeName,
	action,
}: {
	node: Node;
	description?: string;
	icon: ReactNode;
	onChangeName?: (name?: string) => void;
	action?: ReactNode;
}) {
	return (
		<div className="h-[48px] flex justify-between items-center pl-0 pr-[16px] shrink-0">
			<div className="flex gap-[8px] items-center">
				<div className="w-[28px] h-[28px] bg-white-900 rounded-[4px] flex items-center justify-center">
					{icon}
				</div>
				<div>
					<div>
						<EditableText
							onValueChange={(value) => {
								if (value === defaultName(node)) {
									return;
								}
								if (value.trim().length === 0) {
									onChangeName?.();
									return;
								}
								onChangeName?.(value);
							}}
							text={defaultName(node)}
						/>
					</div>
					{description && (
						<p className="px-[5px] text-white-400 text-[10px]">{description}</p>
					)}
				</div>
			</div>
			{action}
		</div>
	);
}

export function PropertiesPanelContent({
	children,
}: {
	children: ReactNode;
}) {
	return (
		<div className="pl-0 pr-[16px] flex-1 h-full flex flex-col overflow-hidden">
			{children}
		</div>
	);
}
