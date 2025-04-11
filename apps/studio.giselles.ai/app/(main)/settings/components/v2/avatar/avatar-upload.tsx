import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/v2/ui/button";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const IMAGE_CONSTRAINTS = {
	maxSize: 4 * 1024 * 1024,
	formats: [
		"image/jpeg",
		"image/png",
		"image/gif",
		"image/svg+xml",
		"image/webp",
	],
};

const ACCEPTED_FILE_TYPES = IMAGE_CONSTRAINTS.formats.join(",");

interface AvatarUploadProps {
	isOpen: boolean;
	onClose: () => void;
	onUpload: (file: File) => Promise<void>;
}

export function AvatarUpload({ isOpen, onClose, onUpload }: AvatarUploadProps) {
	const [preview, setPreview] = useState<string | null>(null);
	const [error, setError] = useState<string>("");
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
			return;
		}

		if (file.size > IMAGE_CONSTRAINTS.maxSize) {
			setError("File too large (max 4MB)");
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

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent
				className="gap-y-6 px-[57px] py-[40px] max-w-[380px] w-full bg-black-900 border-none rounded-[16px] bg-linear-to-br/hsl from-black-600 to-black-250"
				aria-describedby={undefined}
			>
				<div
					aria-hidden="true"
					className="absolute inset-0 rounded-[16px] border-[0.5px] border-transparent bg-black-900 bg-clip-padding"
				/>
				<DialogHeader className="relative z-10">
					<DialogTitle className="text-white-800 font-semibold text-[20px] leading-[28px] font-hubot text-center">
						Upload Avatar
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

					<Button type="button" onClick={handleButtonClick} className="w-full">
						Select Image
					</Button>

					{preview && (
						<div className="relative w-32 h-32 rounded-full overflow-hidden">
							<Image
								src={preview}
								alt="Avatar preview"
								fill
								className="object-cover"
							/>
						</div>
					)}

					{error && (
						<p className="text-error-900 text-sm text-center">{error}</p>
					)}

					<div className="flex justify-end gap-4 w-full">
						<Button
							type="button"
							onClick={onClose}
							className="w-full bg-transparent border-black-400 text-black-400 hover:bg-transparent hover:text-black-400"
						>
							Cancel
						</Button>
						<Button
							type="button"
							onClick={() => {}}
							disabled={!preview || !!error}
							className="w-full"
						>
							Upload
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
