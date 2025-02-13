import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FC, HTMLAttributes } from "react";
import { type NodeGraph, nodeService } from "../../";
import { AgentList } from "./agent-list";
import { KnowledgeList } from "./knowledge-list";

type FinderProps = Pick<
	HTMLAttributes<HTMLDivElement>,
	"className" | "style"
> & {
	onSelect: (node: NodeGraph) => void;
};
export const Finder: FC<FinderProps> = ({ onSelect, style, className }) => {
	return (
		<div style={style} className={className}>
			<DropdownMenu defaultOpen={true} modal={false}>
				<DropdownMenuTrigger />
				<DropdownMenuContent>
					<DropdownMenuGroup>
						<DropdownMenuSub>
							<DropdownMenuSubTrigger>Agent</DropdownMenuSubTrigger>
							<DropdownMenuPortal>
								<DropdownMenuSubContent>
									<AgentList onSelect={onSelect} />
								</DropdownMenuSubContent>
							</DropdownMenuPortal>
						</DropdownMenuSub>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						<DropdownMenuLabel>CREATE TEST NODE</DropdownMenuLabel>
						<DropdownMenuItem
							onSelect={() => {
								const node = nodeService.createNode("onRequest");
								onSelect(node);
							}}
						>
							On Request
						</DropdownMenuItem>
						<DropdownMenuItem
							onSelect={() => {
								const node = nodeService.createNode("response");
								onSelect(node);
							}}
						>
							Response
						</DropdownMenuItem>
						<DropdownMenuItem
							onSelect={() => {
								const node = nodeService.createNode("text", {
									data: {
										template: "",
									},
								});
								onSelect(node);
							}}
						>
							Text
						</DropdownMenuItem>
						<DropdownMenuItem
							onSelect={() => {
								const node = nodeService.createNode("textGeneration");
								onSelect(node);
							}}
						>
							Text Generation
						</DropdownMenuItem>
						<DropdownMenuItem
							onSelect={() => {
								const node = nodeService.createNode("webScraping");
								onSelect(node);
							}}
						>
							Web Scraping
						</DropdownMenuItem>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						<DropdownMenuSub>
							<DropdownMenuSubTrigger>
								Knowledge Retrieval
							</DropdownMenuSubTrigger>
							<DropdownMenuPortal>
								<DropdownMenuSubContent>
									<KnowledgeList onSelect={onSelect} />
								</DropdownMenuSubContent>
							</DropdownMenuPortal>
						</DropdownMenuSub>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};
