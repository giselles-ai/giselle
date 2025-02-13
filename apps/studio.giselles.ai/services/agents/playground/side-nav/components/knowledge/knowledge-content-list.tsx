import { Button } from "@/components/ui/button";
import {
	Command,
	CommandGroup,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { BookOpenIcon, LoaderCircle, UploadIcon } from "lucide-react";
import { type FC, useState } from "react";
import type { KnowledgeContent, KnowledgeId } from "../../../../knowledges";
import { usePlayground } from "../../../context";
import { playgroundOption } from "../../../types";
import { AddFileToKnowledgeContentForm } from "./add-file-to-knowledge-content-form";
import { AddTextToKnowledgeContentForm } from "./add-text-to-knowledge-content-form";
import { AddWebpageToKnowledgeContentForm } from "./add-webpage-to-knowledge-content-form";
import { useContentState } from "./content-state-provider";
import { KnowledgeContentListItem } from "./knowledge-content-list-item";

type KnowledgeContentListProps = {
	knowledgeId: KnowledgeId;
	knowledgeContents: KnowledgeContent[];
};
export const KnowledgeContentList: React.FC<KnowledgeContentListProps> = ({
	knowledgeId,
	knowledgeContents,
}) => {
	return (
		<div className="flex flex-col gap-4">
			<ul className="list-disc list-inside">
				{knowledgeContents.length === 0 && (
					<div className="flex justify-center flex-col items-center py-8 px-4 bg-muted rounded gap-4">
						<div className="">
							<BookOpenIcon className="w-8 h-8" strokeWidth={1} />
						</div>
						<p className="text-center text-xs">
							No knowledge added yet. Add PDFs, documents or other
							<br />
							text to knowledge base that Claude will
							<br />
							reference in every project conversation.
						</p>
					</div>
				)}
				{knowledgeContents.map((knowledgeContent) => (
					<KnowledgeContentListItem
						key={knowledgeContent.id}
						knowledgeContent={knowledgeContent}
					/>
				))}
			</ul>
			<div>
				<ContentUploader knowledgeId={knowledgeId} />
			</div>
		</div>
	);
};

type ContentUploaderProps = {
	knowledgeId: KnowledgeId;
};
const ContentUploader: FC<ContentUploaderProps> = ({ knowledgeId }) => {
	const [open, setOpen] = useState(false);
	const { isAdding, dispatch } = useContentState();
	const { state } = usePlayground();
	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button className="gap-2" disabled={isAdding}>
					{isAdding ? (
						<LoaderCircle className="w-4 h-4 animate-spin" />
					) : (
						<UploadIcon className="w-4 h-4" />
					)}
					<p>Add Content</p>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="p-0 w-[200px]" align="end">
				<Command>
					<CommandList>
						<CommandGroup>
							<CommandItem>
								<AddFileToKnowledgeContentForm
									knowledgeId={knowledgeId}
									onSubmit={() => {
										setOpen(false);
										dispatch({ type: "ADDING" });
									}}
								/>
							</CommandItem>

							<CommandItem>
								<AddTextToKnowledgeContentForm
									knowledgeId={knowledgeId}
									onSubmit={() => {
										setOpen(false);
										dispatch({ type: "ADDING" });
									}}
								/>
							</CommandItem>

							{state.options.includes(playgroundOption.webscraping) && (
								<CommandItem>
									<AddWebpageToKnowledgeContentForm
										knowledgeId={knowledgeId}
										onSubmit={() => {
											setOpen(false);
											dispatch({ type: "ADDING" });
										}}
									/>
								</CommandItem>
							)}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
};
