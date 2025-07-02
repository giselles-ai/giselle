import { isTextGenerationNode, type Node } from "@giselle-sdk/data-type";
import clsx from "clsx/lite";
import { PlusIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../../../ui/dropdown-menu";

export function NodeDropdown({
	trigerNode,
	nodes,
	onValueChange,
}: {
	trigerNode?: ReactNode;
	nodes: Node[];
	onValueChange?: (node: Node) => void;
}) {
	const textGenerationNodes = nodes.filter((node) =>
		isTextGenerationNode(node),
	);
	const textNodes = nodes.filter((node) => node.content.type === "text");
	const fileNodes = nodes.filter((node) => node.content.type === "file");

	const handleValueChange = (value: string) => {
		if (!onValueChange) return;

		const node = nodes.find((node) => node.id === value);
		if (node === undefined) return;

		onValueChange(node);
	};

	return (
		<DropdownMenu>
			{trigerNode ? (
				trigerNode
			) : (
				<DropdownMenuTrigger
					className={clsx(
						"flex items-center cursor-pointer p-[10px] rounded-[8px]",
						"border border-transparent hover:border-white-800",
						"text-[12px] font-[700] text-white-800",
						"transition-colors",
					)}
				>
					<PlusIcon className="size-[12px]" />
					<p>Add Source</p>
				</DropdownMenuTrigger>
			)}
			<DropdownMenuContent
				align="end"
				sideOffset={6}
				onCloseAutoFocus={(e) => {
					e.preventDefault();
				}}
			>
				<DropdownMenuRadioGroup onValueChange={handleValueChange}>
					{textGenerationNodes.length > 0 && (
						<>
							<DropdownMenuLabel>Text Generator</DropdownMenuLabel>
							{textGenerationNodes.map((node) => (
								<DropdownMenuRadioItem value={node.id} key={node.id}>
									{node.name ?? node.content.llm.id}
								</DropdownMenuRadioItem>
							))}
						</>
					)}
					{textNodes.length > 0 && (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuLabel>Text</DropdownMenuLabel>
							{textNodes.map((node) => (
								<DropdownMenuRadioItem value={node.id} key={node.id}>
									{node.name}
								</DropdownMenuRadioItem>
							))}
						</>
					)}
					{fileNodes.length > 0 && (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuLabel>File</DropdownMenuLabel>
							{fileNodes.map((node) => (
								<DropdownMenuRadioItem value={node.id} key={node.id}>
									{node.name}
								</DropdownMenuRadioItem>
							))}
						</>
					)}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
