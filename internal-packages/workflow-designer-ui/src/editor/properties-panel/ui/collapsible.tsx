import clsx from "clsx/lite";
import { ChevronsUpDownIcon, Minimize2Icon } from "lucide-react";
import { type ReactNode, useState } from "react";
import { PropertiesPanelContentBox } from "./content-box";

interface PropertiesPanelCollapsible {
	title: string;
	glanceLabel?: string;
	children: ReactNode;
	expandedClassName?: string;
}

export function PropertiesPanelCollapsible({
	title,
	glanceLabel,
	expandedClassName,
	children,
}: PropertiesPanelCollapsible) {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<>
			{isExpanded ? (
				<PropertiesPanelContentBox
					className={clsx(
						"text-black-300 flex flex-col gap-2",
						expandedClassName,
					)}
				>
					<div className="flex justify-between items-center">
						<p className="font-rosart">{title}</p>
						<button type="button" onClick={() => setIsExpanded(false)}>
							<Minimize2Icon
								size={16}
								className="text-black-50 hover:text-black-300"
							/>
						</button>
					</div>
					{children}
				</PropertiesPanelContentBox>
			) : (
				<button type="button" onClick={() => setIsExpanded(true)}>
					<PropertiesPanelContentBox className="text-black-300 flex justify-between items-center group">
						<div className="flex gap-2 items-center">
							<p className="font-rosart">{title}</p>
							{glanceLabel && (
								<span className="text-[10px] text-black-50">{glanceLabel}</span>
							)}
						</div>
						<ChevronsUpDownIcon
							size={16}
							className="text-black-50 group-hover:text-black-300"
						/>
					</PropertiesPanelContentBox>
				</button>
			)}
		</>
	);
}
