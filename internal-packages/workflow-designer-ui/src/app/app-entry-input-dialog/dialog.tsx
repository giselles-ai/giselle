"use client";

import { Button } from "@giselle-internal/ui/button";
import {
	type App,
	type AppEntryNode,
	createUploadedFileData,
	createUploadingFileData,
	type GenerationContextInput,
	type UploadedFileData,
} from "@giselles-ai/protocol";
import { useGiselle } from "@giselles-ai/react";
import { clsx } from "clsx/lite";
import {
	LoaderIcon,
	PlayIcon,
	SquareArrowOutUpRightIcon,
	XIcon,
} from "lucide-react";
import Link from "next/link";
import { Dialog } from "radix-ui";
import { type FormEventHandler, useCallback, useMemo, useState } from "react";
import { Streamdown } from "streamdown";
import useSWR from "swr";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "../../editor/properties-panel/text-generation-node-properties-panel/tools/ui/tabs";

export function AppEntryInputDialog({
	onClose,
	onSubmit,
	node,
}: {
	onSubmit: (event: {
		inputs: GenerationContextInput[];
	}) => Promise<void> | void;
	onClose?: () => void;
	node: AppEntryNode;
}) {
	const client = useGiselle();
	const { isLoading, data } = useSWR(
		node.content.status === "configured"
			? { namespace: "getApp", appId: node.content.appId }
			: null,
		({ appId }) => client.getApp({ appId }),
	);

	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const apiSampleCode = useMemo(
		() => (data?.app ? generateApiSampleCode(data.app) : ""),
		[data?.app],
	);

	const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
		async (e) => {
			e.preventDefault();

			if (data?.app === undefined) {
				return;
			}

			const formData = new FormData(e.currentTarget);
			const errors: Record<string, string> = {};
			const values: Record<string, string | number | UploadedFileData[]> = {};

			for (const parameter of data.app.parameters) {
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

							const formData = new FormData();
							formData.append("workspaceId", data.app.workspaceId);
							formData.append("fileId", uploadingFileData.id);
							formData.append("fileName", file.name);
							formData.append("file", file);
							await client.uploadFile(formData);

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
		[data, onClose, onSubmit, client],
	);

	if (isLoading) {
		return "loading";
	}

	if (data?.app === undefined) {
		return null;
	}

	const playgroundHref = `/playground?initialAppId=${encodeURIComponent(data.app.id)}`;

	return (
		<div className="flex flex-col h-[500px]">
			<div className="flex justify-between items-center mb-[14px]">
				<div className="flex items-center gap-[12px]">
					<h2 className="text-[20px] font-medium text-text tracking-tight font-sans">
						Run App
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
			<Tabs defaultValue="workspace" className="flex flex-col flex-1 min-h-0">
				<TabsList className="mb-[14px]">
					<TabsTrigger value="workspace">Workspace</TabsTrigger>
					<TabsTrigger value="playground">Playground</TabsTrigger>
					<TabsTrigger value="code">Code</TabsTrigger>
				</TabsList>

				<TabsContent value="workspace" className="flex-1 overflow-y-auto">
					<form
						className="flex flex-col gap-[14px] relative text-inverse"
						onSubmit={handleSubmit}
					>
						<p className="text-[12px] mb-[8px] text-text-muted font-sans font-semibold">
							Run this app with custom input values
						</p>

						<div className="flex flex-col gap-[8px]">
							{data.app.parameters.map((parameter) => {
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
								variant="glass"
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
				</TabsContent>

				<TabsContent value="playground" className="flex-1">
					<div className="flex flex-col gap-[16px] text-inverse">
						<p className="text-[12px] text-text-muted font-sans font-semibold">
							Try this app in the Playground
						</p>
						<Link
							href={playgroundHref}
							target="_blank"
							rel="noopener noreferrer"
							className="block w-full rounded-[12px] border border-blue-muted bg-blue-muted px-[16px] py-[12px] text-[14px] font-medium text-white transition-[filter] text-center hover:brightness-110"
						>
							<span className="inline-flex items-center justify-center gap-[8px]">
								<span>Open Playground</span>
								<SquareArrowOutUpRightIcon
									className="size-[14px]"
									aria-hidden="true"
								/>
							</span>
						</Link>
					</div>
				</TabsContent>

				<TabsContent value="code" className="flex-1 overflow-y-auto">
					<div className="flex flex-col gap-[16px] text-inverse">
						<div className="flex flex-col gap-[8px]">
							<p className="text-[14px] text-inverse">
								You can use the following code to start integrating current app
								into your application.
							</p>
							<p className="text-[14px] text-inverse">
								Your API key can be found{" "}
								<Link
									href="/settings/team/api-keys"
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-400 hover:text-blue-300 underline"
								>
									here
								</Link>
								. Use environment variables or a secret-management tool to
								inject it into your application.
							</p>
						</div>

						<Streamdown className="markdown-renderer">
							{apiSampleCode}
						</Streamdown>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}

function generateApiSampleCode(app: App): string {
	return `\`\`\`typescript
import Giselle from "@giselles-ai/sdk";

const client = new Giselle({
  apiKey: process.env.GISELLE_API_KEY,
});

const { taskId } = await client.app.run({
  appId: "${app.id}",
  input: { text: "your input here" },
});

console.log(taskId);
\`\`\``;
}
