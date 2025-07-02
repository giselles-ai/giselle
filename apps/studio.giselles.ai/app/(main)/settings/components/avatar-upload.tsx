import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { IMAGE_CONSTRAINTS } from "../constants";

const ACCEPTED_FILE_TYPES = IMAGE_CONSTRAINTS.formats.join(",");

interface AvatarUploadProps {
	isOpen: boolean;
	onClose: () => void;
	onUpload: (file: File) => Promise<void>;
}

export function AvatarUpload({ isOpen, onClose, onUpload }: AvatarUploadProps) {
	const [preview, setPreview] = useState<string | null>(null);
	const [error, setError] = useState<string>("");
	const [isUploading, setIsUploading] = useState<boolean>(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!isOpen) {
			if (preview) {
				URL.revokeObjectURL(preview);
				setPreview(null);
			}
			setError("");
			if (inputRef.current) {
				inputRef.current.value = "";
			}
		}
	}, [isOpen, preview]);

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		setError("");
		const file = event.target.files?.[0];

		if (!file) return;

		if (!IMAGE_CONSTRAINTS.formats.includes(file.type)) {
			setError("Please select a JPG, PNG, GIF, SVG, or WebP image");
			if (preview) {
				URL.revokeObjectURL(preview);
				setPreview(null);
			}
			return;
		}

		if (file.size > IMAGE_CONSTRAINTS.maxSize) {
			setError(
				`Please select an image under ${IMAGE_CONSTRAINTS.maxSize / (1024 * 1024)}MB in size`,
			);
			if (preview) {
				URL.revokeObjectURL(preview);
				setPreview(null);
			}
			return;
		}

		if (preview) {
			URL.revokeObjectURL(preview);
		}

		const objectUrl = URL.createObjectURL(file);
		setPreview(objectUrl);
	};

	const handleButtonClick = () => {
		inputRef.current?.click();
	};

	const handleClose = () => {
		onClose();
	};

	const handleUpdate = async () => {
		if (!preview || !inputRef.current?.files?.[0]) return;

		try {
			setIsUploading(true);
			setError("");
			await onUpload(inputRef.current.files[0]);
			handleClose();
		} catch (error) {
			setError(
				error instanceof Error ? error.message : "Failed to upload image",
			);
			console.error("Upload error:", error);
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent
				className="gap-y-6 px-[57px] py-[40px] max-w-[380px] w-full bg-black-900 border-none rounded-[16px] bg-linear-to-br/hsl from-black-600 to-black-250 sm:rounded-[16px]"
				style={{
					animation: "fadeIn 0.2s ease-out",
					transformOrigin: "center",
				}}
				aria-describedby={undefined}
			>
				<style jsx global>{`
					@keyframes fadeIn {
						from {
							opacity: 0;
							transform: scale(0.95);
						}
						to {
							opacity: 1;
							transform: scale(1);
						}
					}
				`}</style>
				<div
					aria-hidden="true"
					className="absolute inset-0 rounded-[16px] border-[0.5px] border-transparent bg-black-900 bg-clip-padding"
				/>
				<DialogHeader className="relative z-10">
					<DialogTitle className="text-white-800 font-semibold text-[20px] leading-[28px] font-sans text-center">
						Update Your Profile
					</DialogTitle>
				</DialogHeader>

				<div className="relative z-10 flex flex-col items-center gap-4">
					<Input
						ref={inputRef}
						type="file"
						accept={ACCEPTED_FILE_TYPES}
						className="hidden"
						onChange={handleFileSelect}
					/>

					{preview ? (
						<div className="flex flex-col gap-[30px]">
							<div className="relative w-[80px] h-[80px] mx-auto rounded-full overflow-hidden border border-primary-100/30 mb-auto">
								<Image
									src={preview}
									alt="Avatar preview"
									fill
									sizes="80px"
									className="object-cover w-full h-full scale-[1.02]"
									style={{ objectPosition: "center" }}
								/>
							</div>
							<Button
								type="button"
								onClick={handleButtonClick}
								className="w-full h-[38px] text-[16px] leading-[19.2px] tracking-[-0.04em] bg-primary-200 text-black-800 font-bold hover:bg-transparent hover:text-primary-200 hover:border-primary-200 transition-colors disabled:border-0 disabled:bg-black-400 disabled:text-black-600"
							>
								Change Image
							</Button>
						</div>
					) : (
						<Button
							type="button"
							onClick={handleButtonClick}
							className="w-full h-[38px] text-[16px] leading-[19.2px] tracking-[-0.04em] bg-primary-200 text-black-800 font-bold hover:bg-transparent hover:text-primary-200 hover:border-primary-200 transition-colors disabled:border-0 disabled:bg-black-400 disabled:text-black-600"
						>
							Select Image
						</Button>
					)}

					{error && (
						<p className="text-error-900 text-[12px] leading-[20.4px] font-geist text-center">
							{error}
						</p>
					)}

					<div className="flex justify-end gap-4 w-full">
						<Button
							type="button"
							onClick={onClose}
							disabled={isUploading}
							className="w-full h-[38px] bg-transparent border-black-400 text-black-400 text-[16px] leading-[19.2px] tracking-[-0.04em] hover:bg-transparent hover:text-black-400 transition-colors disabled:border-0 disabled:bg-black-400 disabled:text-black-600"
						>
							Cancel
						</Button>
						<Button
							type="button"
							onClick={handleUpdate}
							disabled={!preview || !!error || isUploading}
							className="w-full h-[38px] text-[16px] leading-[19.2px] tracking-[-0.04em] bg-primary-200 text-black-800 font-bold hover:bg-transparent hover:text-primary-200 hover:border-primary-200 transition-colors disabled:border-0 disabled:bg-black-400 disabled:text-black-600"
						>
							{isUploading ? (
								<div className="h-5 w-5 animate-spin rounded-full border-2 border-white-800 border-t-transparent" />
							) : (
								"Save"
							)}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
