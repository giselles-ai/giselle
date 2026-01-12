import type { SelectOption } from "@giselle-internal/ui/select";
import { useToasts } from "@giselle-internal/ui/toast";
import {
	createFailedFileData,
	createUploadedFileData,
	createUploadingFileData,
	type FileData,
	type GenerationContextInput,
	type ParameterItem,
	type UploadedFileData,
} from "@giselles-ai/protocol";
import { APICallError, useGiselle } from "@giselles-ai/react";
import { PlayIcon } from "lucide-react";
import {
	createElement,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { StageApp } from "../../playground/types";

type FileRestrictionErrorState = {
	rejectedFileNames: string[];
};

export const ACCEPTED_FILE_TYPES = "application/pdf,image/*";

const ALLOWED_FILE_MIME_TYPES = new Set(["application/pdf"]);
const IMAGE_FILE_EXTENSIONS = new Set([
	"png",
	"jpg",
	"jpeg",
	"gif",
	"bmp",
	"webp",
	"svg",
	"tif",
	"tiff",
	"heic",
	"heif",
]);

/**
 * Hard limit to upload file since Vercel Serverless Functions have a 4.5MB body size limit.
 * @see internal-packages/workflow-designer-ui/src/editor/properties-panel/file-node-properties-panel/file-panel.tsx
 */
const MAX_UPLOAD_SIZE_BYTES = 1024 * 1024 * 4.5;

function formatFileSize(size: number): string {
	const units = ["B", "KB", "MB", "GB", "TB"];
	let formattedSize = size;
	let i = 0;
	while (formattedSize >= 1024 && i < units.length - 1) {
		formattedSize /= 1024;
		i++;
	}
	return `${formattedSize} ${units[i]}`;
}

function getFileSizeExceededMessage(maxSizeBytes: number) {
	return `File size exceeds the limit. Please upload a file smaller than ${formatFileSize(maxSizeBytes)}.`;
}

function isLikelyOversizeErrorMessage(message: string) {
	const m = message.toLowerCase();
	return (
		m.includes("413") ||
		m.includes("payload too large") ||
		m.includes("bodySizeLimit".toLowerCase()) ||
		m.includes("request body") ||
		m.includes("body size")
	);
}

function getUploadErrorMessage(error: unknown) {
	const oversizeMessage = getFileSizeExceededMessage(MAX_UPLOAD_SIZE_BYTES);

	if (APICallError.isInstance(error)) {
		if (error.statusCode === 413) {
			return oversizeMessage;
		}
		return error.message || "Upload failed";
	}
	if (error instanceof Error) {
		if (isLikelyOversizeErrorMessage(error.message)) {
			return oversizeMessage;
		}
		return error.message || "Upload failed";
	}
	return "Upload failed";
}

function getFileExtension(fileName: string) {
	const index = fileName.lastIndexOf(".");
	if (index === -1) {
		return "";
	}
	return fileName.slice(index + 1).toLowerCase();
}

function isAllowedFileType(file: File) {
	const mimeType = file.type?.toLowerCase() ?? "";
	if (mimeType.startsWith("image/")) {
		return true;
	}
	if (mimeType && ALLOWED_FILE_MIME_TYPES.has(mimeType)) {
		return true;
	}
	const extension = getFileExtension(file.name);
	if (extension === "pdf") {
		return true;
	}
	return extension ? IMAGE_FILE_EXTENSIONS.has(extension) : false;
}

function useEnterSubmit(onSubmit: () => void) {
	const composingRef = useRef(false);

	const handleCompositionStart = useCallback(() => {
		composingRef.current = true;
	}, []);

	const handleCompositionEnd = useCallback(() => {
		composingRef.current = false;
	}, []);

	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLTextAreaElement>) => {
			const nativeEvent = event.nativeEvent;

			if (composingRef.current || nativeEvent.isComposing) {
				return;
			}

			if (event.key !== "Enter") {
				return;
			}

			if (event.shiftKey) {
				return;
			}

			event.preventDefault();
			onSubmit();
		},
		[onSubmit],
	);

	return {
		handleCompositionStart,
		handleCompositionEnd,
		handleKeyDown,
	};
}

function containsFiles(event: React.DragEvent<HTMLElement>) {
	return Array.from(event.dataTransfer?.items ?? []).some(
		(item) => item.kind === "file",
	);
}

export function useStageInput({
	apps,
	selectedAppId,
	setSelectedAppId,
	onSubmitAction,
	isRunning,
}: {
	apps?: StageApp[];
	selectedAppId: string | undefined;
	setSelectedAppId: (appId: string) => void;
	onSubmitAction: (event: {
		inputs: GenerationContextInput[];
		selectedApp: StageApp;
	}) => void;
	isRunning: boolean;
}) {
	const client = useGiselle();
	const { toast } = useToasts();

	const selectedApp = useMemo(() => {
		if (!selectedAppId) return undefined;
		return (apps ?? []).find((app) => app.id === selectedAppId);
	}, [apps, selectedAppId]);

	const appOptions = useMemo(
		() =>
			(apps ?? []).map(
				(app) =>
					({
						value: app.id,
						label: app.name,
						icon: createElement(PlayIcon, { className: "h-4 w-4" }),
					}) satisfies SelectOption,
			),
		[apps],
	);

	const [inputValue, setInputValue] = useState("");
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const dragCounterRef = useRef(0);
	const [isDragActive, setIsDragActive] = useState(false);

	const [attachedFiles, setAttachedFiles] = useState<FileData[]>([]);
	const [localPreviews, setLocalPreviews] = useState<Map<string, string>>(
		new Map(),
	);
	const [fileRestrictionError, setFileRestrictionError] =
		useState<FileRestrictionErrorState | null>(null);

	const resizeTextarea = useCallback(() => {
		const textarea = textareaRef.current;
		if (textarea) {
			textarea.style.height = "auto";
			textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
		}
	}, []);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			setInputValue(e.target.value);
			resizeTextarea();
		},
		[resizeTextarea],
	);

	const handleDragEnter = useCallback(
		(event: React.DragEvent<HTMLDivElement>) => {
			if (!containsFiles(event)) {
				return;
			}
			event.preventDefault();
			dragCounterRef.current += 1;
			setIsDragActive(true);
		},
		[],
	);

	const handleDragOver = useCallback(
		(event: React.DragEvent<HTMLDivElement>) => {
			if (!containsFiles(event)) {
				return;
			}
			event.preventDefault();
			event.dataTransfer.dropEffect = "copy";
		},
		[],
	);

	const handleDragLeave = useCallback(
		(event: React.DragEvent<HTMLDivElement>) => {
			if (!containsFiles(event)) {
				return;
			}
			event.preventDefault();
			dragCounterRef.current = Math.max(dragCounterRef.current - 1, 0);
			if (dragCounterRef.current === 0) {
				setIsDragActive(false);
			}
		},
		[],
	);

	const handleFilesAdded = useCallback(
		async (incomingFiles: File[]) => {
			if (!selectedApp) {
				toast("Select an app: Choose an app before attaching files.", {
					type: "warning",
					preserve: false,
				});
				return;
			}

			const usableFiles = incomingFiles.filter(
				(file): file is File => file instanceof File && file.size > 0,
			);
			if (usableFiles.length === 0) {
				return;
			}

			const rejectedNames = new Set<string>();
			const existingNames = new Set(attachedFiles.map((file) => file.name));
			const batchSeen = new Set<string>();
			const uploads: Array<{
				file: File;
				uploading: ReturnType<typeof createUploadingFileData>;
				workspaceId: StageApp["workspaceId"];
			}> = [];

			for (const file of usableFiles) {
				if (!isAllowedFileType(file)) {
					const rejectedName =
						file.name.trim().length > 0 ? file.name : "Unnamed file";
					rejectedNames.add(rejectedName);
					continue;
				}

				const name =
					file.name || `file-${existingNames.size + batchSeen.size + 1}`;
				if (existingNames.has(name) || batchSeen.has(name)) {
					toast(`Duplicate file: ${name} is already attached.`, {
						type: "warning",
						preserve: false,
					});
					continue;
				}

				batchSeen.add(name);
				const uploading = createUploadingFileData({
					name,
					type: file.type || "application/octet-stream",
					size: file.size,
				});

				if (file.type.startsWith("image/")) {
					const previewUrl = URL.createObjectURL(file);
					setLocalPreviews((prev) => {
						const next = new Map(prev);
						next.set(uploading.id, previewUrl);
						return next;
					});
				}

				uploads.push({
					file,
					uploading,
					workspaceId: selectedApp.workspaceId,
				});
			}

			if (rejectedNames.size > 0) {
				setFileRestrictionError({
					rejectedFileNames: Array.from(rejectedNames),
				});
			}

			if (uploads.length === 0) {
				return;
			}

			setAttachedFiles((current) => {
				const currentNames = new Set(current.map((file) => file.name));
				const newEntries = uploads
					.filter(({ uploading }) => !currentNames.has(uploading.name))
					.map(({ uploading }) => uploading);
				if (newEntries.length === 0) {
					return current;
				}
				return [...current, ...newEntries];
			});

			for (const { file, uploading, workspaceId } of uploads) {
				if (file.size > MAX_UPLOAD_SIZE_BYTES) {
					const message = getFileSizeExceededMessage(MAX_UPLOAD_SIZE_BYTES);
					toast(`Upload failed: ${message}`, {
						type: "error",
						preserve: false,
					});
					const failed = createFailedFileData(uploading, message);
					setAttachedFiles((current) => {
						return current.map((entry) =>
							entry.id === failed.id ? failed : entry,
						);
					});
					continue;
				}

				try {
					const formData = new FormData();
					formData.append("workspaceId", workspaceId);
					formData.append("fileId", uploading.id);
					formData.append("fileName", uploading.name);
					formData.append("file", file);
					await client.uploadFile(formData);
					const uploaded = createUploadedFileData(uploading, Date.now());
					setAttachedFiles((current) => {
						return current.map((entry) =>
							entry.id === uploaded.id ? uploaded : entry,
						);
					});
				} catch (error) {
					const message = getUploadErrorMessage(error);
					toast(`Upload failed: ${message}`, {
						type: "error",
						preserve: false,
					});
					const failed = createFailedFileData(uploading, message);
					setAttachedFiles((current) => {
						return current.map((entry) =>
							entry.id === failed.id ? failed : entry,
						);
					});
				}
			}
		},
		[selectedApp, attachedFiles, client, toast],
	);

	const handleDrop = useCallback(
		(event: React.DragEvent<HTMLDivElement>) => {
			if (!containsFiles(event)) {
				return;
			}
			event.preventDefault();
			dragCounterRef.current = 0;
			setIsDragActive(false);
			const droppedFiles = Array.from(event.dataTransfer?.files ?? []);
			void handleFilesAdded(droppedFiles);
		},
		[handleFilesAdded],
	);

	const handleFileInputChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const files = event.target.files ? Array.from(event.target.files) : [];
			void handleFilesAdded(files);
			event.target.value = "";
		},
		[handleFilesAdded],
	);

	const handleRemoveFile = useCallback((fileId: string) => {
		setAttachedFiles((current) => current.filter((file) => file.id !== fileId));
		setLocalPreviews((prev) => {
			const previewUrl = prev.get(fileId);
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl);
				const next = new Map(prev);
				next.delete(fileId);
				return next;
			}
			return prev;
		});
	}, []);

	const handleImageLoad = useCallback((fileId: string) => {
		setLocalPreviews((prev) => {
			const previewUrl = prev.get(fileId);
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl);
				const next = new Map(prev);
				next.delete(fileId);
				return next;
			}
			return prev;
		});
	}, []);

	const handleDismissFileRestrictionError = useCallback(() => {
		setFileRestrictionError(null);
	}, []);

	const handleAttachmentButtonClick = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const hasInput = inputValue.trim().length > 0;
	const hasPendingUploads = attachedFiles.some(
		(file) => file.status === "uploading",
	);
	const canSubmit =
		!!selectedApp && hasInput && !isRunning && !hasPendingUploads;

	const submitInputs = useCallback(() => {
		if (!selectedApp || !inputValue.trim() || isRunning) return;
		if (hasPendingUploads) {
			toast(
				"Uploading files: Please wait for uploads to finish before sending.",
				{ type: "info", preserve: false },
			);
			return;
		}

		const textParam = selectedApp.parameters.find(
			(p) => p.type === "multiline-text",
		);
		const parameterItems: ParameterItem[] = [];
		if (textParam) {
			parameterItems.push({
				name: textParam.id,
				type: "string",
				value: inputValue,
			});
		}

		const filesParam = selectedApp.parameters.find((p) => p.type === "files");
		if (filesParam) {
			const uploadedFiles = attachedFiles.filter(
				(file): file is UploadedFileData => file.status === "uploaded",
			);
			parameterItems.push({
				name: filesParam.id,
				type: "files",
				value: uploadedFiles,
			});
		}

		onSubmitAction({
			inputs: [
				{
					type: "parameters",
					items: parameterItems,
				},
			],
			selectedApp,
		});

		setAttachedFiles([]);
		setInputValue("");
		requestAnimationFrame(() => {
			resizeTextarea();
		});
	}, [
		selectedApp,
		inputValue,
		isRunning,
		hasPendingUploads,
		attachedFiles,
		onSubmitAction,
		resizeTextarea,
		toast,
	]);

	const { handleCompositionStart, handleCompositionEnd, handleKeyDown } =
		useEnterSubmit(submitInputs);

	const localPreviewsRef = useRef(localPreviews);
	useEffect(() => {
		localPreviewsRef.current = localPreviews;
	}, [localPreviews]);

	useEffect(() => {
		return () => {
			for (const previewUrl of localPreviewsRef.current.values()) {
				URL.revokeObjectURL(previewUrl);
			}
		};
	}, []);

	return useMemo(
		() => ({
			appOptions,
			selectedApp,
			setSelectedAppId,
			textareaRef,
			fileInputRef,
			inputValue,
			setInputValue,
			isDragActive,
			attachedFiles,
			localPreviews,
			fileRestrictionError,
			canSubmit,
			hasInput,
			hasPendingUploads,
			handleInputChange,
			handleCompositionStart,
			handleCompositionEnd,
			handleKeyDown,
			handleDragEnter,
			handleDragOver,
			handleDragLeave,
			handleDrop,
			handleFileInputChange,
			handleAttachmentButtonClick,
			handleRemoveFile,
			handleImageLoad,
			handleDismissFileRestrictionError,
			handleSubmit: submitInputs,
		}),
		[
			appOptions,
			selectedApp,
			setSelectedAppId,
			inputValue,
			isDragActive,
			attachedFiles,
			localPreviews,
			fileRestrictionError,
			canSubmit,
			hasInput,
			hasPendingUploads,
			handleInputChange,
			handleCompositionStart,
			handleCompositionEnd,
			handleKeyDown,
			handleDragEnter,
			handleDragOver,
			handleDragLeave,
			handleDrop,
			handleFileInputChange,
			handleAttachmentButtonClick,
			handleRemoveFile,
			handleImageLoad,
			handleDismissFileRestrictionError,
			submitInputs,
		],
	);
}
