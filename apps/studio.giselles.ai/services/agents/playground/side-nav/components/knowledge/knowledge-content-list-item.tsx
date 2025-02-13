import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { TrashIcon } from "lucide-react";
import { type FC, useEffect } from "react";
import {
	type KnowledgeContent,
	removeKnowledgeContent,
} from "../../../../knowledges";
import { useContentState } from "./content-state-provider";

type KnowledgeContentListItemProps = {
	knowledgeContent: KnowledgeContent;
};
export const KnowledgeContentListItem: FC<KnowledgeContentListItemProps> = ({
	knowledgeContent,
}) => {
	const { dispatch } = useContentState();
	useEffect(() => {
		dispatch({ type: "ADDED" });
		return () => {
			dispatch({ type: "REMOVED" });
		};
	}, [dispatch]);

	return (
		<li className="flex items-center justify-between py-1">
			<div className="flex items-center gap-2">
				<span>{knowledgeContent.name}</span>
				<Badge variant="outline">{knowledgeContent.status}</Badge>
			</div>
			<DeleteDialog knowledgeContent={knowledgeContent} />
		</li>
	);
};

type DeleteDialogProps = {
	knowledgeContent: KnowledgeContent;
};
const DeleteDialog: FC<DeleteDialogProps> = ({ knowledgeContent }) => {
	const { dispatch, isRemoving } = useContentState();

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button>
					<TrashIcon className="h-4 w-4" />
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Confirm deletion of content</DialogTitle>
					<DialogDescription>
						Are you sure you would like to delete the content{" "}
						<span className="font-bold">{knowledgeContent.name}</span>(
						{knowledgeContent.id})?
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose asChild>
						<Button type="button" disabled={isRemoving}>
							Cancel
						</Button>
					</DialogClose>
					<Button
						type="submit"
						disabled={isRemoving}
						onClick={async () => {
							dispatch({ type: "REMOVING" });
							await removeKnowledgeContent(knowledgeContent.id);
						}}
					>
						Delete file
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
