"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
	ArrowUpFromLine,
	Loader2,
	MoreVertical,
	Settings,
	Trash,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
	useTransition,
} from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	DOCUMENT_VECTOR_STORE_MAX_FILE_SIZE_BYTES,
	DOCUMENT_VECTOR_STORE_MAX_FILE_SIZE_LABEL,
} from "@/lib/vector-stores/document/constants";
import { isPdfFile } from "@/lib/vector-stores/document/utils";
import { useToast } from "@/packages/contexts/toast";
import type { DocumentVectorStoreId } from "@/packages/types";
import {
	GlassDialogBody,
	GlassDialogContent,
	GlassDialogFooter,
	GlassDialogHeader,
} from "../../components/glass-dialog-content";
import type { DocumentVectorStoreWithProfiles } from "../data";
import { DOCUMENT_EMBEDDING_PROFILES } from "../document-embedding-profiles";
import type { ActionResult, DocumentVectorStoreUpdateInput } from "../types";

type DocumentVectorStoreItemProps = {
	store: DocumentVectorStoreWithProfiles;
	deleteAction: (
		documentVectorStoreId: DocumentVectorStoreId,
	) => Promise<ActionResult>;
	updateAction: (
		documentVectorStoreId: DocumentVectorStoreId,
		input: DocumentVectorStoreUpdateInput,
	) => Promise<ActionResult>;
};

export function DocumentVectorStoreItem({
	store,
	deleteAction,
	updateAction,
}: DocumentVectorStoreItemProps) {
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isConfigureDialogOpen, setIsConfigureDialogOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [isUpdating, setIsUpdating] = useState(false);
	const router = useRouter();
	const { addToast } = useToast();

	const handleConfirmDelete = () => {
		startTransition(async () => {
			const result = await deleteAction(store.id);
			setIsDeleteDialogOpen(false);
			if (result.success) {
				router.refresh();
			} else {
				addToast({
					title: "Error",
					message: result.error,
					type: "error",
				});
			}
		});
	};

	const disableMenu = isPending || isUpdating;

	return (
		<div className="group relative rounded-[12px] overflow-hidden w-full bg-white/[0.02] backdrop-blur-[8px] border-[0.5px] border-white/8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(255,255,255,0.2)] before:content-[''] before:absolute before:inset-0 before:bg-white before:opacity-[0.02] before:rounded-[inherit] before:pointer-events-none hover:border-white/12 transition-colors duration-200">
			<div className="px-[24px] py-[16px]">
				<div className="flex items-start justify-between gap-4 mb-4">
					<div>
						<h5 className="text-white-400 font-medium text-[16px] leading-[22.4px] font-sans">
							{store.name}
						</h5>
						<div className="text-black-300 text-[13px] leading-[18px] font-geist mt-1">
							ID: {store.id}
						</div>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								aria-label="Document vector store actions"
								className="transition-opacity duration-200 p-2 text-white/60 hover:text-white/80 hover:bg-white/5 rounded-md disabled:opacity-50"
								disabled={disableMenu}
							>
								<MoreVertical className="h-4 w-4" />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="w-[180px] bg-black-850 border-[0.5px] border-black-400 rounded-[8px]"
						>
							<DropdownMenuItem
								onSelect={() => {
									setIsConfigureDialogOpen(true);
								}}
								className="flex items-center px-3 py-2 text-[14px] leading-[16px] text-white-400 hover:bg-white/5 rounded-md"
							>
								<Settings className="h-4 w-4 mr-2" />
								Configure Sources
							</DropdownMenuItem>
							<DropdownMenuSeparator className="my-1 h-px bg-white/10" />
							<DropdownMenuItem
								onSelect={(event) => {
									event.preventDefault();
									setIsDeleteDialogOpen(true);
								}}
								className="flex items-center px-3 py-2 text-[14px] leading-[16px] text-error-900 hover:bg-error-900/20 rounded-md"
							>
								<Trash className="h-4 w-4 mr-2" />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<Dialog.Root
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
			>
				<GlassDialogContent variant="destructive">
					<GlassDialogHeader
						title="Delete Document Vector Store"
						description={`This action cannot be undone. This will permanently delete the document vector store "${store.name}" and its embedding profiles.`}
						onClose={() => setIsDeleteDialogOpen(false)}
						variant="destructive"
					/>
					<GlassDialogFooter
						onCancel={() => setIsDeleteDialogOpen(false)}
						onConfirm={handleConfirmDelete}
						confirmLabel="Delete"
						isPending={isPending}
						variant="destructive"
					/>
				</GlassDialogContent>
			</Dialog.Root>

			<DocumentVectorStoreConfigureDialog
				open={isConfigureDialogOpen}
				onOpenChange={setIsConfigureDialogOpen}
				store={store}
				updateAction={updateAction}
				onSuccess={() => {
					router.refresh();
					addToast({
						title: "Vector store updated",
						message: "Configuration saved successfully.",
						type: "success",
					});
				}}
				onPendingChange={setIsUpdating}
				showErrorToast={(message) => {
					addToast({ title: "Error", message, type: "error" });
				}}
			/>
		</div>
	);
}

type DocumentVectorStoreConfigureDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	store: DocumentVectorStoreWithProfiles;
	updateAction: (
		documentVectorStoreId: DocumentVectorStoreId,
		input: DocumentVectorStoreUpdateInput,
	) => Promise<ActionResult>;
	onSuccess: () => void;
	onPendingChange: (pending: boolean) => void;
	showErrorToast: (message: string) => void;
};

type DocumentUploadResponse = {
	successes: Array<{
		fileName: string;
		sourceId: string;
		storageKey: string;
	}>;
	failures: Array<{
		fileName: string;
		error: string;
		code?: string;
	}>;
};

type DocumentSourceItem = {
	id: string;
	fileName: string;
};

function buildDocumentSourceItems(
	sources: DocumentVectorStoreWithProfiles["sources"],
): DocumentSourceItem[] {
	return sources.map((source) => ({
		id: source.id,
		fileName: source.fileName,
	}));
}

function buildUploadedSourceItems(
	successes: DocumentUploadResponse["successes"],
): DocumentSourceItem[] {
	if (successes.length === 0) {
		return [];
	}

	return successes.map((success) => ({
		id: success.sourceId,
		fileName: success.fileName,
	}));
}

function mergeDocumentSourceItems(
	previous: DocumentSourceItem[],
	newItems: DocumentSourceItem[],
): DocumentSourceItem[] {
	if (newItems.length === 0) {
		return previous;
	}
	const existingIds = new Set(previous.map((item) => item.id));
	const filteredNewItems = newItems.filter((item) => !existingIds.has(item.id));
	if (filteredNewItems.length === 0) {
		return previous;
	}
	return [...filteredNewItems, ...previous];
}

function DocumentVectorStoreConfigureDialog({
	open,
	onOpenChange,
	store,
	updateAction,
	onSuccess,
	onPendingChange,
	showErrorToast,
}: DocumentVectorStoreConfigureDialogProps) {
	const availableProfiles = useMemo(
		() => Object.entries(DOCUMENT_EMBEDDING_PROFILES),
		[],
	);
	const defaultProfiles = useMemo(
		() => availableProfiles.map(([id]) => Number(id)),
		[availableProfiles],
	);
	const nameInputId = useId();
	const [name, setName] = useState(store.name);
	const [selectedProfiles, setSelectedProfiles] = useState<number[]>(
		store.embeddingProfileIds.length > 0
			? store.embeddingProfileIds
			: defaultProfiles,
	);
	const [error, setError] = useState<string>("");
	const [isPending, startTransition] = useTransition();
	const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);
	const [isDragActive, setIsDragActive] = useState(false);
	const [uploadMessage, setUploadMessage] = useState("");
	const [documentSources, setDocumentSources] = useState<DocumentSourceItem[]>(
		() => buildDocumentSourceItems(store.sources),
	);
	const [deletingSourceIds, setDeletingSourceIds] = useState<Set<string>>(
		() => new Set(),
	);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const router = useRouter();

	useEffect(() => {
		onPendingChange(isPending);
	}, [isPending, onPendingChange]);

	useEffect(() => {
		if (!open) {
			return;
		}
		setError("");
		setName(store.name);
		setSelectedProfiles(
			store.embeddingProfileIds.length > 0
				? store.embeddingProfileIds
				: defaultProfiles,
		);
		setUploadMessage("");
		setDocumentSources(buildDocumentSourceItems(store.sources));
	}, [open, store, defaultProfiles]);

	const handleFilesUpload = useCallback(
		async (fileList: FileList | File[]) => {
			const filesArray = Array.from(fileList);
			if (filesArray.length === 0) {
				return;
			}

			const validFiles: File[] = [];
			const errors: string[] = [];

			for (const file of filesArray) {
				if (!isPdfFile(file)) {
					errors.push(`${file.name} is not a PDF file.`);
					continue;
				}
				if (file.size === 0) {
					errors.push(`${file.name} is empty and cannot be uploaded.`);
					continue;
				}
				if (file.size > DOCUMENT_VECTOR_STORE_MAX_FILE_SIZE_BYTES) {
					errors.push(
						`${file.name} exceeds the ${DOCUMENT_VECTOR_STORE_MAX_FILE_SIZE_LABEL} limit.`,
					);
					continue;
				}
				validFiles.push(file);
			}

			if (errors.length > 0) {
				showErrorToast(errors[0]);
			}

			if (validFiles.length === 0) {
				return;
			}

			const formData = new FormData();
			validFiles.forEach((file) => {
				formData.append("files", file);
			});

			setIsUploadingDocuments(true);

			try {
				const response = await fetch(
					`/api/vector-stores/document/${store.id}/documents`,
					{
						method: "POST",
						body: formData,
					},
				);
				const payload = (await response.json().catch(() => null)) as
					| DocumentUploadResponse
					| { error?: string }
					| null;
				if (payload && "successes" in payload && "failures" in payload) {
					const { successes, failures } = payload;
					const hasSuccesses = successes.length > 0;
					const hasFailures = failures.length > 0;

					if (hasSuccesses) {
						const newItems = buildUploadedSourceItems(successes);
						setDocumentSources((prev) =>
							mergeDocumentSourceItems(prev, newItems),
						);
						setUploadMessage(
							successes.length === 1
								? `${successes[0].fileName} uploaded successfully.`
								: `${successes.length} files uploaded successfully.`,
						);
						router.refresh();
					} else {
						setUploadMessage("");
					}

					if (hasFailures) {
						const [firstFailure, ...remainingFailures] = failures;
						const additionalFailures = remainingFailures.length;
						const baseMessage = `Failed to upload ${firstFailure.fileName}: ${firstFailure.error}.`;
						const failureMessage =
							additionalFailures > 0
								? `${baseMessage} ${additionalFailures} more file(s) failed.`
								: baseMessage;
						showErrorToast(failureMessage);
					}

					if (!response.ok && response.status !== 207) {
						setUploadMessage("");
					}
					return;
				}

				if (!response.ok || (payload && "error" in payload && payload.error)) {
					const message =
						payload && "error" in payload && payload.error
							? payload.error
							: "Failed to upload files";
					throw new Error(message);
				}

				const uploadedCount = validFiles.length;
				setUploadMessage(
					uploadedCount === 1
						? `${validFiles[0].name} uploaded successfully.`
						: `${uploadedCount} files uploaded successfully.`,
				);
			} catch (uploadError) {
				const message =
					uploadError instanceof Error
						? uploadError.message
						: "Failed to upload files";
				showErrorToast(message);
				setUploadMessage("");
			} finally {
				setIsUploadingDocuments(false);
			}
		},
		[showErrorToast, store.id, router],
	);

	const handleFileInputChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			if (event.target.files?.length) {
				void handleFilesUpload(event.target.files);
				event.target.value = "";
			}
		},
		[handleFilesUpload],
	);

	const handleSelectFiles = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const handleDragOver = useCallback(
		(event: React.DragEvent<HTMLButtonElement>) => {
			event.preventDefault();
			setIsDragActive(true);
		},
		[],
	);

	const handleDragLeave = useCallback(
		(event: React.DragEvent<HTMLButtonElement>) => {
			event.preventDefault();
			setIsDragActive(false);
		},
		[],
	);

	const handleDrop = useCallback(
		(event: React.DragEvent<HTMLButtonElement>) => {
			event.preventDefault();
			setIsDragActive(false);
			if (event.dataTransfer.files?.length) {
				void handleFilesUpload(event.dataTransfer.files);
			}
		},
		[handleFilesUpload],
	);

	const handleDeleteSource = useCallback(
		async (sourceId: string, fileName: string) => {
			setDeletingSourceIds((prev) => {
				const next = new Set(prev);
				next.add(sourceId);
				return next;
			});

			try {
				const response = await fetch(
					`/api/vector-stores/document/${store.id}/documents`,
					{
						method: "DELETE",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ sourceId }),
					},
				);
				const result = (await response.json().catch(() => null)) as
					| { success: true }
					| { error: string }
					| null;

				if (!response.ok || !result || ("error" in result && result.error)) {
					const errorMessage =
						result && "error" in result && result.error
							? result.error
							: "Failed to delete file";
					throw new Error(errorMessage);
				}

				setDocumentSources((prev) =>
					prev.filter((item) => item.id !== sourceId),
				);
				setUploadMessage(`${fileName} deleted.`);
				router.refresh();
			} catch (deleteError) {
				const message =
					deleteError instanceof Error
						? deleteError.message
						: "Failed to delete file";
				showErrorToast(message);
			} finally {
				setDeletingSourceIds((prev) => {
					const next = new Set(prev);
					next.delete(sourceId);
					return next;
				});
			}
		},
		[router, showErrorToast, store.id],
	);

	const toggleProfile = (profileId: number) => {
		setSelectedProfiles((prev) => {
			const isSelected = prev.includes(profileId);
			if (isSelected) {
				if (prev.length === 1) {
					return prev;
				}
				return prev.filter((id) => id !== profileId);
			}
			return [...prev, profileId];
		});
	};

	const handleSave = () => {
		const trimmedName = name.trim();
		if (trimmedName.length === 0) {
			setError("Name is required");
			return;
		}
		if (selectedProfiles.length === 0) {
			setError("Select at least one embedding profile");
			return;
		}

		setError("");
		startTransition(async () => {
			const result = await updateAction(store.id, {
				name: trimmedName,
				embeddingProfileIds: selectedProfiles,
			});
			if (result.success) {
				onOpenChange(false);
				onSuccess();
				return;
			}
			setError(result.error);
			showErrorToast(result.error);
		});
	};

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<GlassDialogContent>
				<GlassDialogHeader
					title="Configure Sources"
					description="Update the name, embedding models, and source files for this vector store."
					onClose={() => onOpenChange(false)}
				/>
				<GlassDialogBody>
					<div className="space-y-6">
						<div className="flex flex-col gap-2">
							<label
								htmlFor={nameInputId}
								className="text-sm text-black-300 font-geist"
							>
								Name
							</label>
							<input
								id={nameInputId}
								className="w-full rounded-md bg-black-950/40 border border-white/10 px-3 py-2 text-white-400 focus:outline-none focus:ring-1 focus:ring-white/20"
								placeholder="Vector store name"
								value={name}
								onChange={(event) => setName(event.target.value)}
								disabled={isPending}
							/>
						</div>

						<div className="space-y-3">
							<div className="text-white-400 text-[14px] leading-[16.8px] font-sans">
								Embedding Models
							</div>
							<div className="text-white-400/60 text-[12px]">
								Select at least one embedding model for ingestion.
							</div>
							<div className="space-y-2">
								{availableProfiles.map(([profileIdString, profile]) => {
									const profileId = Number(profileIdString);
									const isSelected = selectedProfiles.includes(profileId);
									const isLastSelected =
										selectedProfiles.length === 1 && isSelected;
									return (
										<label
											key={profileId}
											className="flex items-start gap-3 p-3 rounded-lg bg-black-300/10 hover:bg-black-300/20 transition-colors"
										>
											<input
												type="checkbox"
												checked={isSelected}
												disabled={isPending || isLastSelected}
												onChange={() => toggleProfile(profileId)}
												className="mt-1 w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
											/>
											<div className="flex-1">
												<div className="text-white-400 text-[14px] font-medium">
													{profile.name}
												</div>
												<div className="text-white-400/60 text-[12px] mt-1">
													Provider: {profile.provider} • Dimensions{" "}
													{profile.dimensions}
												</div>
											</div>
										</label>
									);
								})}
							</div>
						</div>

						<div className="space-y-3">
							<div className="text-white-400 text-[16px] font-medium">
								Source Files
							</div>
							<div className="text-white-400/60 text-[12px]">
								Upload PDF files (maximum{" "}
								{DOCUMENT_VECTOR_STORE_MAX_FILE_SIZE_LABEL} each) to include in
								this vector store.
							</div>
							<button
								type="button"
								aria-label="Upload PDF files"
								onClick={handleSelectFiles}
								onDragOver={handleDragOver}
								onDragLeave={handleDragLeave}
								onDrop={handleDrop}
								disabled={isUploadingDocuments}
								className={`flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/10 bg-black-950/20 px-6 py-8 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 ${isDragActive ? "border-white/30 bg-white/5" : ""} ${isUploadingDocuments ? "opacity-60" : ""}`}
							>
								<ArrowUpFromLine className="h-8 w-8 text-black-300" />
								<p className="text-white-400 text-sm">
									Drop PDF files here to upload.
								</p>
								<p className="text-xs text-black-300">
									Maximum {DOCUMENT_VECTOR_STORE_MAX_FILE_SIZE_LABEL} per file.
								</p>
								<span className="text-sm font-semibold text-white-400 underline">
									Select files
								</span>
								{isUploadingDocuments ? (
									<div className="flex items-center gap-2 text-xs text-black-300">
										<Loader2 className="h-3 w-3 animate-spin" />
										Uploading...
									</div>
								) : null}
							</button>
							<input
								ref={fileInputRef}
								type="file"
								accept="application/pdf,.pdf"
								multiple
								className="hidden"
								onChange={handleFileInputChange}
							/>
							{uploadMessage ? (
								<p className="text-xs text-black-300">{uploadMessage}</p>
							) : null}
							{documentSources.length > 0 ? (
								<div className="space-y-2">
									<div className="text-white-400 text-sm font-medium">
										Uploaded Files
									</div>
									<ul className="max-h-48 space-y-2 overflow-y-auto pr-1">
										{documentSources.map((source) => {
											const isDeleting = deletingSourceIds.has(source.id);
											return (
												<li
													key={source.id}
													className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black-950/30 px-3 py-2"
												>
													<span className="text-white-400 text-sm font-medium break-all">
														{source.fileName}
													</span>
													<button
														type="button"
														onClick={() =>
															void handleDeleteSource(
																source.id,
																source.fileName,
															)
														}
														disabled={isDeleting}
														className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-black-300 transition-colors hover:text-error-500 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:cursor-not-allowed disabled:opacity-50"
													>
														<span className="sr-only">
															Delete {source.fileName}
														</span>
														{isDeleting ? (
															<Loader2 className="h-3.5 w-3.5 animate-spin" />
														) : (
															<Trash className="h-3.5 w-3.5" />
														)}
													</button>
												</li>
											);
										})}
									</ul>
								</div>
							) : (
								<p className="text-xs text-black-300">
									No PDF files uploaded yet.
								</p>
							)}
						</div>

						{error ? <p className="text-error-900 text-sm">{error}</p> : null}
					</div>
				</GlassDialogBody>
				<GlassDialogFooter
					onCancel={() => onOpenChange(false)}
					onConfirm={handleSave}
					confirmLabel="Save"
					isPending={isPending}
					confirmButtonType="button"
				/>
			</GlassDialogContent>
		</Dialog.Root>
	);
}
