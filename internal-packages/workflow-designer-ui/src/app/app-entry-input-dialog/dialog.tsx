"use client";

import { Button } from "@giselle-internal/ui/button";
import {
	type App,
	type AppEntryNode,
	createUploadedFileData,
	createUploadingFileData,
	type UploadedFileData,
	type GenerationContextInput,
} from "@giselles-ai/protocol";
import { useGiselle } from "@giselles-ai/react";
import { clsx } from "clsx/lite";
import { LoaderIcon, PlayIcon, XIcon } from "lucide-react";
import { Dialog } from "radix-ui";
import { type FormEventHandler, useCallback, useMemo, useState } from "react";
import useSWR from "swr";

interface AppEntryInputDialogFromAppEntryNode {
	node: AppEntryNode;
	app?: never;
}

interface AppEntryInputDialogFromApp {
	node?: never;
	app: App;
}

type AppEntryInputDialogProps =
	| AppEntryInputDialogFromAppEntryNode
	| AppEntryInputDialogFromApp;

function isFromAppEntryNode(
	props: unknown,
): props is AppEntryInputDialogFromAppEntryNode {
	return (
		typeof props === "object" &&
		props !== null &&
		"node" in props &&
		props.node !== undefined
	);
}

function isFromApp(props: unknown): props is AppEntryInputDialogFromApp {
	return (
		typeof props === "object" &&
		props !== null &&
		"app" in props &&
		props.app !== undefined
	);
}

export function AppEntryInputDialog({
	onClose,
	onSubmit,
	...props
}: AppEntryInputDialogProps & {
	onSubmit: (event: {
		inputs: GenerationContextInput[];
	}) => Promise<void> | void;
	onClose?: () => void;
}) {
	const client = useGiselle();
	const { isLoading, data } = useSWR(
		isFromAppEntryNode(props) && props.node.content.status === "configured"
			? { namespace: "getApp", appId: props.node.content.appId }
			: null,
		({ appId }) => client.getApp({ appId }).then((res) => res.app),
	);
	const app = useMemo(() => {
		if (
			isFromAppEntryNode({
				node: props.node,
				app: props.app,
			})
		) {
			return data;
		}
		if (
			isFromApp({
				node: props.node,
				app: props.app,
			})
		) {
			return props.app;
		}
		return undefined;
	}, [props.node, props.app, data]);

	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
		async (e) => {
			e.preventDefault();

			if (app === undefined) {
				return;
			}

			const formData = new FormData(e.currentTarget);
			const errors: Record<string, string> = {};
			const values: Record<string, string | number | UploadedFileData[]> = {};

			for (const parameter of app.parameters) {
				switch (parameter.type) {
					case "text":
					case "multiline-text": {
						const formDataEntryValue = formData.get(parameter.name);
						const value = formDataEntryValue
							? formDataEntryValue.toString().trim()
							: "";

						if (parameter.required && value === "") {
							errors[parameter.id] = `${parameter.name} is required`;
							continue;
						}

						if (value === "") {
							values[parameter.id] = "";
							continue;
						}

						values[parameter.id] = value;
						break;
					}
					case "number": {
						const formDataEntryValue = formData.get(parameter.name);
						const value = formDataEntryValue
							? formDataEntryValue.toString().trim()
							: "";

						if (parameter.required && value === "") {
							errors[parameter.id] = `${parameter.name} is required`;
							continue;
						}

						if (value === "") {
							values[parameter.id] = "";
							continue;
						}

						const numValue = Number(value);
						if (Number.isNaN(numValue)) {
							errors[parameter.id] = `${parameter.name} must be a valid number`;
						} else {
							values[parameter.id] = numValue;
						}
						break;
					}
					case "files": {
						const files = formData
							.getAll(parameter.name)
							.filter(
								(entry): entry is File =>
									entry instanceof File && entry.size > 0,
							);

						if (parameter.required && files.length === 0) {
							errors[parameter.id] = `${parameter.name} is required`;
							continue;
						}

						if (files.length === 0) {
							values[parameter.id] = [];
							continue;
						}

						const uploadedFiles: UploadedFileData[] = [];

						for (const file of files) {
							const uploadingFileData = createUploadingFileData({
								name: file.name,
								type: file.type || "application/octet-stream",
								size: file.size,
							});

							await client.uploadFile({
								workspaceId: app.workspaceId,
								file,
								fileId: uploadingFileData.id,
								fileName: file.name,
							});

							uploadedFiles.push(
								createUploadedFileData(uploadingFileData, Date.now()),
							);
						}

						values[parameter.id] = uploadedFiles;
						break;
					}
					default: {
						const _exhaustiveCheck: never = parameter.type;
						throw new Error(`Unhandled input type: ${_exhaustiveCheck}`);
					}
				}
			}

			if (Object.keys(errors).length > 0) {
				setValidationErrors(errors);
				return;
			}

			setValidationErrors({});
			setIsSubmitting(true);

			try {
				const parameterItems = Object.entries(values).map(([id, value]) => {
					if (typeof value === "number") {
						return {
							name: id,
							type: "number" as const,
							value,
						};
					}

					if (Array.isArray(value)) {
						return {
							name: id,
							type: "files" as const,
							value,
						};
					}

					return {
						name: id,
						type: "string" as const,
						value: value as string,
					};
				});

				await onSubmit({
					inputs: [
						{
							type: "parameters",
							items: parameterItems,
						},
					],
				});
				onClose?.();
			} finally {
				setIsSubmitting(false);
			}
		},
		[app, onClose, onSubmit, client],
	);

	if (isLoading) {
		return "loading";
	}

	if (app === undefined) {
		return null;
	}

	return (
		<>
			<div className="flex justify-between items-center mb-[14px]">
				<div className="flex items-center gap-[12px]">
					<div className="w-[96px] h-[96px] rounded-[16px] bg-white/5 flex items-center justify-center flex-shrink-0">
						<svg
							role="img"
							aria-label="App icon"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 486 640"
							className="h-[48px] w-[48px] text-white/40"
							fill="currentColor"
						>
							<title>App Icon</title>
							<path d="M278.186 397.523C241.056 392.676 201.368 394.115 171.855 391.185C142.556 387.776 131.742 363.167 136.856 355.603C158.378 364.712 177.928 368.547 201.794 368.387C241.642 368.227 275.576 356.242 303.544 332.486C331.511 308.729 345.362 280.285 344.936 247.207C342.912 222.545 327.782 184.194 293.742 157.188C290.971 154.791 283.673 150.583 283.673 150.583C258.635 135.615 230.188 128.318 198.438 128.69C170.843 130.129 149.747 135.509 126.574 143.711C73.0358 162.781 54.7103 208.589 55.243 249.018V249.924C63.1273 312.298 93.8652 328.757 125.935 351.342L88.1651 394.913L89.1772 400.613C89.1772 400.613 144.527 399.441 174.412 401.998C257.783 410.84 291.877 467.408 292.516 511.14C293.209 560.784 250.431 625.022 180.645 625.555C81.2397 626.354 78.5229 422.292 78.5229 422.292L0 504.215C2.6636 550.237 46.613 601.958 82.5182 617.938C130.356 636.847 187.251 632.107 211.969 629.603C237.486 627.046 363.368 607.072 379.136 498.143C379.136 467.302 358.041 407.964 278.186 397.523ZM266.093 226.433C279.678 277.302 283.14 315.334 263.749 345.27C250.538 359.598 229.868 364.872 209.199 363.114C206.535 362.901 179.207 358.267 162.746 322.685C179.26 301.272 218.522 250.563 255.599 204.222C260.66 209.814 266.093 226.487 266.093 226.487V226.433ZM136.643 152.607H136.536C149.534 135.935 185.44 129.916 203.392 135.349C221.771 144.404 235.515 161.023 250.645 192.769L196.201 261.909L156.62 312.245C150.333 300.633 144.58 286.997 140.158 271.337C120.927 203.103 123.484 170.877 136.589 152.607H136.643Z" />
							<path d="M370.506 0C370.506 55.3433 310.362 106.638 255.013 106.638C310.362 106.638 370.506 157.933 370.506 213.277C370.506 157.933 430.65 106.638 486 106.638C430.650 106.638 370.506 55.3433 370.506 0Z" />
						</svg>
					</div>
					<h2 className="font-accent text-[18px] font-bold text-primary-100 drop-shadow-[0_0_10px_#0087F6]">
						{app.name}
					</h2>
				</div>
				<div className="flex gap-[12px]">
					<Dialog.Close asChild>
						<button
							type="button"
							className="text-inverse hover:text-inverse outline-none"
						>
							<XIcon className="size-[20px]" />
						</button>
					</Dialog.Close>
				</div>
			</div>
			<div className="flex flex-col h-full">
				<form
					className="flex-1 flex flex-col gap-[14px] relative text-inverse overflow-y-hidden"
					onSubmit={handleSubmit}
				>
					<p className="text-[12px] mb-[8px] text-text-muted font-sans font-semibold">
						Execute this flow with custom input values
					</p>

					<div className="flex flex-col gap-[8px]">
						{app.parameters.map((parameter) => {
							return (
								<fieldset key={parameter.id} className={clsx("grid gap-2")}>
									<label
										className="text-[14px] font-medium text-inverse"
										htmlFor={parameter.name}
									>
										{parameter.name}
										{parameter.required && (
											<span className="text-red-500 ml-1">*</span>
										)}
									</label>
									{parameter.type === "text" && (
										<input
											type="text"
											name={parameter.name}
											id={parameter.name}
											className={clsx(
												"w-full flex justify-between items-center rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none",
												"border-[1px]",
												validationErrors[parameter.id]
													? "border-red-500"
													: "border-border",
												"text-[14px]",
											)}
										/>
									)}
									{parameter.type === "multiline-text" && (
										<textarea
											name={parameter.name}
											id={parameter.name}
											className={clsx(
												"w-full flex justify-between items-center rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none",
												"border-[1px]",
												validationErrors[parameter.id]
													? "border-red-500"
													: "border-border",
												"text-[14px]",
											)}
											rows={4}
										/>
									)}
									{parameter.type === "number" && (
										<input
											type="number"
											name={parameter.name}
											id={parameter.name}
											className={clsx(
												"w-full flex justify-between items-center rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none",
												"border-[1px]",
												validationErrors[parameter.id]
													? "border-red-500"
													: "border-border",
												"text-[14px]",
											)}
										/>
									)}
									{parameter.type === "files" && (
										<input
											type="file"
											name={parameter.name}
											id={parameter.name}
											multiple
											className={clsx(
												"w-full flex justify-between items-center rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none",
												"border-[1px]",
												validationErrors[parameter.id]
													? "border-red-500"
													: "border-border",
												"text-[14px]",
											)}
										/>
									)}
									{validationErrors[parameter.id] && (
										<span className="text-red-500 text-[12px] font-medium">
											{validationErrors[parameter.id]}
										</span>
									)}
								</fieldset>
							);
						})}
					</div>
					<div className="flex justify-end">
						<Button
							variant="solid"
							size="large"
							type="submit"
							disabled={isSubmitting}
							leftIcon={
								isSubmitting ? (
									<LoaderIcon className="size-[14px] animate-spin" />
								) : (
									<PlayIcon className="size-[14px] fill-current" />
								)
							}
						>
							{isSubmitting ? "Running..." : "Run"}
						</Button>
					</div>
				</form>
			</div>
		</>
	);
}
