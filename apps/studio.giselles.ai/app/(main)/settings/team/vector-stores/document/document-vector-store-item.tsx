"use client";

import {
	Dialog,
	DialogBody,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@giselle-internal/ui/dialog";
import { useToasts } from "@giselle-internal/ui/toast";
import { DEFAULT_EMBEDDING_PROFILE_ID } from "@giselles-ai/protocol";
import * as Tooltip from "@radix-ui/react-tooltip";
import clsx from "clsx/lite";
import {
	AlertCircle,
	ArrowUpFromLine,
	CheckCircle2,
	Clock,
	Loader2,
	Settings,
	Trash,
	X,
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
	DOCUMENT_VECTOR_STORE_MAX_FILE_SIZE_BYTES,
	DOCUMENT_VECTOR_STORE_MAX_FILE_SIZE_LABEL,
	DOCUMENT_VECTOR_STORE_SUPPORTED_FILE_EXTENSIONS,
	DOCUMENT_VECTOR_STORE_SUPPORTED_FILE_TYPE_LABEL,
	DOCUMENT_VECTOR_STORE_SUPPORTED_MIME_TYPES,
} from "@/lib/vector-stores/document/constants";
import { isSupportedDocumentFile } from "@/lib/vector-stores/document/utils";
import type { DocumentVectorStoreId } from "@/packages/types";
import { Button } from "../../../components/button";
import type { DocumentVectorStoreWithProfiles } from "../data";
import { DOCUMENT_EMBEDDING_PROFILES } from "../document-embedding-profiles";
import type { ActionResult, DocumentVectorStoreUpdateInput } from "../types";
import { GlassCard } from "../ui/glass-card";
import { RepoActionMenu } from "../ui/repo-action-menu";

const DOCUMENT_UPLOAD_ACCEPT = [
	...DOCUMENT_VECTOR_STORE_SUPPORTED_MIME_TYPES,
	...DOCUMENT_VECTOR_STORE_SUPPORTED_FILE_EXTENSIONS,
].join(",");

const SUPPORTED_FILE_TYPES_LABEL =
	DOCUMENT_VECTOR_STORE_SUPPORTED_FILE_TYPE_LABEL;

type IngestStatus = "idle" | "running" | "completed" | "failed";

function IngestStatusBadge({
	status,
	errorCode,
}: {
	status: IngestStatus;
	errorCode?: string | null;
}) {
	const config = {
		idle: {
			icon: Clock,
			label: "Pending",
			className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
		},
		running: {
			icon: Loader2,
			label: "Processing",
			className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
			animate: true,
		},
		completed: {
			icon: CheckCircle2,
			label: "Ready",
			className: "bg-green-500/10 text-green-500 border-green-500/20",
		},
		failed: {
			icon: AlertCircle,
			label: "Failed",
			className: "bg-error-500/10 text-error-500 border-error-500/20",
		},
	}[status];

	const Icon = config.icon;
	const badge = (
		<span
			className={clsx(
				"inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
				config.className,
			)}
		>
			<Icon
				className={clsx("h-3 w-3", config.animate && "animate-spin")}
				aria-hidden="true"
			/>
			{config.label}
		</span>
	);

	if (status === "failed" && errorCode) {
		return (
			<Tooltip.Provider delayDuration={200}>
				<Tooltip.Root>
					<Tooltip.Trigger asChild>{badge}</Tooltip.Trigger>
					<Tooltip.Portal>
						<Tooltip.Content
							side="top"
							className="z-50 max-w-xs rounded-md border border-border-muted bg-surface px-3 py-2 text-xs text-inverse shadow-lg"
						>
							<p className="font-medium">Error: {errorCode}</p>
							<Tooltip.Arrow style={{ fill: "var(--color-surface)" }} />
						</Tooltip.Content>
					</Tooltip.Portal>
				</Tooltip.Root>
			</Tooltip.Provider>
		);
	}

	return badge;
}

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
	const { toast: pushToast, error: pushErrorToast } = useToasts();

	const handleConfirmDelete = () => {
		startTransition(async () => {
			const result = await deleteAction(store.id);
			setIsDeleteDialogOpen(false);
			if (result.success) {
				router.refresh();
			} else {
				pushErrorToast(result.error);
			}
		});
	};

	const disableMenu = isPending || isUpdating;

	return (
		<GlassCard className="group" paddingClassName="px-[24px] py-[16px]">
			<div className="flex items-start justify-between gap-4 mb-4">
				<div>
					<h5 className="text-inverse font-medium text-[16px] leading-[22.4px] font-sans">
						{store.name}
					</h5>
					<div className="text-text/60 text-[13px] leading-[18px] font-geist mt-1">
						ID: {store.id}
					</div>
				</div>
				<RepoActionMenu
					disabled={disableMenu}
					actions={[
						{
							value: "configure",
							label: "Configure Sources",
							icon: <Settings className="h-4 w-4" />,
							disabled: disableMenu,
							onSelect: () => setIsConfigureDialogOpen(true),
						},
						{
							value: "delete",
							label: "Delete",
							icon: <Trash className="h-4 w-4 text-error-900" />,
							destructive: true,
							disabled: disableMenu,
							onSelect: () => setIsDeleteDialogOpen(true),
						},
					]}
				/>
			</div>

			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent variant="destructive">
					<DialogHeader>
						<div className="flex items-center justify-between">
							<DialogTitle className="font-sans text-[20px] font-medium tracking-tight text-error-900">
								Delete Document Vector Store
							</DialogTitle>
							<DialogClose className="rounded-sm text-inverse opacity-70 hover:opacity-100 focus:outline-none">
								<X className="h-5 w-5" />
								<span className="sr-only">Close</span>
							</DialogClose>
						</div>
						<DialogDescription className="font-geist mt-2 text-[14px] text-error-900/50">
							{`This action cannot be undone. This will permanently delete the document vector store "${store.name}" and its embedding profiles.`}
						</DialogDescription>
					</DialogHeader>
					<DialogBody />
					<DialogFooter>
						<div className="mt-6 flex justify-end gap-x-3">
							<Button
								variant="link"
								onClick={() => setIsDeleteDialogOpen(false)}
								disabled={isPending}
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								onClick={handleConfirmDelete}
								disabled={isPending}
							>
								{isPending ? "Processing..." : "Delete"}
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<DocumentVectorStoreConfigureDialog
				open={isConfigureDialogOpen}
				onOpenChange={setIsConfigureDialogOpen}
				store={store}
				updateAction={updateAction}
				onSuccess={() => {
					router.refresh();
					pushToast("Vector store updated.", { type: "success" });
				}}
				onPendingChange={setIsUpdating}
				showErrorToast={pushErrorToast}
			/>
		</GlassCard>
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
	ingestStatus: IngestStatus;
	ingestErrorCode: string | null;
};

function buildDocumentSourceItems(
	sources: DocumentVectorStoreWithProfiles["sources"],
): DocumentSourceItem[] {
	return sources.map((source) => ({
		id: source.id,
		fileName: source.fileName,
		ingestStatus: source.ingestStatus as IngestStatus,
		ingestErrorCode: source.ingestErrorCode,
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
		ingestStatus: "idle" as IngestStatus,
		ingestErrorCode: null,
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
	const selectableProfiles = useMemo(
		() =>
			availableProfiles.filter(([, profile]) => profile.provider !== "cohere"),
		[availableProfiles],
	);
	const defaultProfiles = useMemo(() => {
		const primaryIds = selectableProfiles.map(([id]) => Number(id));
		const fallbackIds =
			primaryIds.length > 0
				? primaryIds
				: availableProfiles.map(([id]) => Number(id));
		if (fallbackIds.includes(DEFAULT_EMBEDDING_PROFILE_ID)) {
			return [DEFAULT_EMBEDDING_PROFILE_ID];
		}
		return fallbackIds.length > 0 ? [fallbackIds[0]] : [];
	}, [selectableProfiles, availableProfiles]);
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
	const [isValidFile, setIsValidFile] = useState(true);
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
				if (!isSupportedDocumentFile(file)) {
					errors.push(
						`${file.name} is not a supported file type. Supported types: ${SUPPORTED_FILE_TYPES_LABEL}.`,
					);
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

	const validateItems = useCallback(
		(dataTransferItemList: DataTransferItemList) => {
			let isValid = true;
			for (const dataTransferItem of dataTransferItemList) {
				if (!isValid) {
					break;
				}
				if (dataTransferItem.kind !== "file") {
					isValid = false;
					break;
				}
				const file = dataTransferItem.getAsFile();
				if (file) {
					isValid = isSupportedDocumentFile(file);
				}
			}
			return isValid;
		},
		[],
	);

	const handleDragOver = useCallback(
		(event: React.DragEvent<HTMLButtonElement>) => {
			event.preventDefault();
			const isValid = validateItems(event.dataTransfer.items);
			setIsValidFile(isValid);
			setIsDragActive(true);
		},
		[validateItems],
	);

	const handleDragLeave = useCallback(
		(event: React.DragEvent<HTMLButtonElement>) => {
			event.preventDefault();
			setIsDragActive(false);
			setIsValidFile(true);
		},
		[],
	);

	const handleDrop = useCallback(
		(event: React.DragEvent<HTMLButtonElement>) => {
			event.preventDefault();
			setIsDragActive(false);
			setIsValidFile(true);
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
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent variant="glass">
				<DialogHeader>
					<div className="flex items-center justify-between">
						<DialogTitle className="font-sans text-[20px] font-medium tracking-tight text-inverse">
							Configure Sources
						</DialogTitle>
						<DialogClose className="rounded-sm text-inverse opacity-70 hover:opacity-100 focus:outline-none">
							<X className="h-5 w-5" />
							<span className="sr-only">Close</span>
						</DialogClose>
					</div>
					<DialogDescription className="font-geist my-2 text-[14px] text-text-muted">
						Update the name, embedding models, and source files for this vector
						store.
					</DialogDescription>
				</DialogHeader>
				<DialogBody>
					<div className="space-y-6">
						<div className="flex flex-col gap-2">
							<label
								htmlFor={nameInputId}
								className="text-inverse text-[14px] leading-[16.8px] font-sans"
							>
								Name
							</label>
							<input
								id={nameInputId}
								className="w-full rounded-md bg-surface border border-border-muted px-3 py-2 text-inverse focus:outline-none focus:ring-1 focus:ring-inverse/20"
								placeholder="Vector store name"
								value={name}
								onChange={(event) => setName(event.target.value)}
								disabled={isPending}
							/>
						</div>

						<div className="space-y-3">
							<div className="text-inverse text-[14px] leading-[16.8px] font-sans">
								Embedding Models
							</div>
							<div className="text-inverse/60 text-[12px]">
								Select at least one embedding model for ingestion.
							</div>
							<div className="space-y-2">
								{selectableProfiles.map(([profileIdString, profile]) => {
									const profileId = Number(profileIdString);
									const isSelected = selectedProfiles.includes(profileId);
									const isLastSelected =
										selectedProfiles.length === 1 && isSelected;
									return (
										<label
											key={profileIdString}
											className="flex items-start gap-3 p-3 rounded-lg bg-surface hover:bg-white/5 transition-colors"
										>
											<input
												type="checkbox"
												checked={isSelected}
												disabled={isPending || isLastSelected}
												onChange={() => toggleProfile(profileId)}
												className="mt-1 w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
											/>
											<div className="flex-1">
												<div className="text-inverse text-[14px] font-medium">
													{profile.name}
												</div>
												<div className="text-inverse/60 text-[12px] mt-1">
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
							<div className="text-inverse text-[16px] font-medium">
								Source Files
							</div>
							<div className="text-inverse/60 text-[12px]">
								Upload {SUPPORTED_FILE_TYPES_LABEL} files (maximum{" "}
								{DOCUMENT_VECTOR_STORE_MAX_FILE_SIZE_LABEL} each) to include in
								this vector store.
							</div>
							<button
								type="button"
								aria-label={`Upload ${SUPPORTED_FILE_TYPES_LABEL} files`}
								onClick={handleSelectFiles}
								onDragOver={handleDragOver}
								onDragLeave={handleDragLeave}
								onDrop={handleDrop}
								disabled={isUploadingDocuments}
								className="group w-full"
								data-dragging={isDragActive}
								data-valid={isValidFile}
							>
								<div
									className={clsx(
										"h-full w-full flex flex-col justify-center items-center gap-[16px] px-[24px] py-[16px]",
										"bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_5%,transparent)]",
										"border border-dotted rounded-[8px] border-transparent",
										"group-hover:border-black-400",
										"group-data-[dragging=true]:border-black-400",
										"group-data-[dragging=true]:group-data-[valid=false]:border-error-900",
										isUploadingDocuments && "opacity-60",
									)}
								>
									{isDragActive ? (
										isValidFile ? (
											<>
												<ArrowUpFromLine className="size-[30px] text-text-muted" />
												<p className="text-center text-inverse">
													Drop to upload your {SUPPORTED_FILE_TYPES_LABEL} files
												</p>
											</>
										) : (
											<>
												<AlertCircle className="size-[30px] text-error-900" />
												<p className="text-center text-error-900">
													Only {SUPPORTED_FILE_TYPES_LABEL} files are allowed
												</p>
											</>
										)
									) : (
										<div className="flex flex-col gap-[16px] justify-center items-center py-[16px]">
											<ArrowUpFromLine className="size-[38px] text-text-muted" />
											<div className="text-center flex flex-col gap-[16px] text-inverse cursor-pointer">
												<p>
													Drop {SUPPORTED_FILE_TYPES_LABEL} files here to
													upload.
												</p>
												<div className="flex gap-[8px] justify-center items-center">
													<span>or</span>
													<span className="font-bold text-[14px] underline">
														Select files
													</span>
												</div>
											</div>
										</div>
									)}
									{isUploadingDocuments ? (
										<div className="flex items-center gap-2 text-xs text-text/60">
											<Loader2 className="h-3 w-3 animate-spin" />
											Uploading...
										</div>
									) : null}
								</div>
							</button>
							<input
								ref={fileInputRef}
								type="file"
								accept={DOCUMENT_UPLOAD_ACCEPT}
								multiple
								className="hidden"
								onChange={handleFileInputChange}
							/>
							{uploadMessage ? (
								<p className="text-xs text-text/60">{uploadMessage}</p>
							) : null}
							{documentSources.length > 0 ? (
								<div className="space-y-2">
									<div className="text-inverse text-sm font-medium">
										Uploaded Files
									</div>
									<ul className="max-h-48 space-y-2 overflow-y-auto pr-1">
										{documentSources.map((source) => {
											const isDeleting = deletingSourceIds.has(source.id);
											return (
												<li
													key={source.id}
													className="flex items-center justify-between gap-3 rounded-lg border border-border-muted bg-surface px-3 py-2"
												>
													<div className="flex items-start justify-between min-w-0 flex-1 gap-2">
														<span className="text-inverse text-sm font-medium break-all min-w-0">
															{source.fileName}
														</span>
														<div className="flex-shrink-0 pt-0.5">
															<IngestStatusBadge
																status={source.ingestStatus}
																errorCode={source.ingestErrorCode}
															/>
														</div>
													</div>
													<button
														type="button"
														onClick={() =>
															void handleDeleteSource(
																source.id,
																source.fileName,
															)
														}
														disabled={isDeleting}
														className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text/60 transition-colors hover:text-error-500 focus:outline-none focus:ring-2 focus:ring-inverse/30 disabled:cursor-not-allowed disabled:opacity-50 flex-shrink-0"
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
								<p className="text-xs text-text/60">No files uploaded yet.</p>
							)}
						</div>

						{error ? <p className="text-error-900 text-sm">{error}</p> : null}
					</div>
				</DialogBody>
				<DialogFooter>
					<div className="mt-6 flex justify-end gap-x-3">
						<Button
							variant="link"
							onClick={() => onOpenChange(false)}
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button variant="primary" onClick={handleSave} disabled={isPending}>
							{isPending ? "Processing..." : "Save"}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
