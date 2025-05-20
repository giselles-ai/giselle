"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type {
	GitHubRepositoryIndexStatus,
	githubRepositoryIndex,
} from "@/drizzle";
import type { GitHubRepositoryIndexId } from "@/packages/types";
import { Trash } from "lucide-react";
import { useState, useTransition } from "react";

type RepositoryItemProps = {
	repositoryIndex: typeof githubRepositoryIndex.$inferSelect;
	deleteRepositoryIndexAction: (
		indexId: GitHubRepositoryIndexId,
	) => Promise<void>;
};

export function RepositoryItem({
	repositoryIndex,
	deleteRepositoryIndexAction,
}: RepositoryItemProps) {
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [isPending, startTransition] = useTransition();

	const handleDelete = async () => {
		startTransition(async () => {
			try {
				await deleteRepositoryIndexAction(repositoryIndex.id);
				setShowDeleteDialog(false);
			} catch (error) {
				console.error(error);
			}
		});
	};

	return (
		<div className="border border-black-400 rounded-md p-4 bg-black-900/50">
			<div className="flex justify-between items-center">
				<div>
					<h5 className="text-white-400 font-medium text-[16px] leading-[19.2px] font-hubot">
						{repositoryIndex.owner}/{repositoryIndex.repo}
					</h5>
					<div className="flex items-center gap-2 mt-1">
						<StatusBadge status={repositoryIndex.status} />
						{repositoryIndex.lastIngestedCommitSha && (
							<span className="text-black-400 text-[12px] leading-[20.4px] font-geist">
								Last Ingested:{" "}
								{repositoryIndex.lastIngestedCommitSha.substring(0, 7)}
							</span>
						)}
					</div>
				</div>
				<div className="ml-auto flex gap-2 items-center">
					<AlertDialog
						open={showDeleteDialog}
						onOpenChange={setShowDeleteDialog}
					>
						<AlertDialogTrigger asChild>
							<Button
								variant="destructive"
								className="h-8 px-3 text-[12px] flex items-center gap-1 rounded-md transition-colors duration-150"
								disabled={isPending}
								onClick={() => setShowDeleteDialog(true)}
							>
								<Trash className="h-4 w-4 mr-1" />
								{isPending ? "Deleting..." : "Delete"}
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Delete Repository</AlertDialogTitle>
								<AlertDialogDescription>
									This action cannot be undone. Are you sure you want to delete
									this repository?
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel
									type="button"
									onClick={() => setShowDeleteDialog(false)}
									disabled={isPending}
									className="py-2 px-4 border-[0.5px] border-black-400 rounded-[8px] font-hubot"
								>
									Cancel
								</AlertDialogCancel>
								<AlertDialogAction
									type="submit"
									onClick={handleDelete}
									disabled={isPending}
									className="py-2 px-4 bg-error-900 rounded-[8px] text-white-400 font-hubot"
								>
									{isPending ? "Deleting..." : "Delete"}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>
		</div>
	);
}

function StatusBadge({ status }: { status: GitHubRepositoryIndexStatus }) {
	let bgColor = "bg-gray-500";
	let textColor = "text-white";
	let label = "Unknown";

	switch (status) {
		case "idle":
			bgColor = "bg-gray-500";
			textColor = "text-white";
			label = "Waiting for ingestion";
			break;
		case "running":
			bgColor = "bg-blue-500";
			textColor = "text-white";
			label = "Ingesting";
			break;
		case "completed":
			bgColor = "bg-green-500";
			textColor = "text-white";
			label = "Ready";
			break;
		case "failed":
			bgColor = "bg-red-500";
			textColor = "text-white";
			label = "Error";
			break;
		default: {
			const _exhaustiveCheck: never = status;
			throw new Error(`Unknown status: ${_exhaustiveCheck}`);
		}
	}

	return (
		<span
			className={`${bgColor} ${textColor} text-[10px] leading-[12px] font-semibold px-2 py-0.5 rounded-full`}
		>
			{label}
		</span>
	);
}
