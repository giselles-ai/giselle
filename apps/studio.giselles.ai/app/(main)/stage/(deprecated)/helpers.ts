import type {
	FileId,
	ParameterItem,
	Trigger,
	UploadedFileData,
	WorkspaceId,
} from "@giselles-ai/protocol";
import {
	createUploadedFileData,
	createUploadingFileData,
} from "@giselles-ai/protocol";
import type { FormInput, FormValues, ValidationErrors } from "./types";

/**
 * This code is based on internal-packages/workflow-designer-ui/src/header/ui/trigger-input-dialog/helpers.ts
 */

export function createInputsFromTrigger(
	trigger: Trigger | undefined,
): FormInput[] {
	if (trigger === undefined) {
		return [];
	}

	switch (trigger.configuration.provider) {
		case "github": {
			// GitHub triggers don't have configurable parameters
			return [];
		}
		case "manual": {
			return trigger.configuration.event.parameters.map((parameter) => ({
				name: parameter.id,
				label: parameter.name,
				type: parameter.type,
				required: parameter.required,
			}));
		}
		default: {
			const _exhaustiveCheck: never = trigger.configuration;
			throw new Error(`Unhandled provider: ${_exhaustiveCheck}`);
		}
	}
}

export function parseFormInputs(
	inputs: FormInput[],
	formData: FormData,
): { errors: ValidationErrors; values: FormValues } {
	const errors: ValidationErrors = {};
	const values: FormValues = {};

	for (const input of inputs) {
		const formDataEntryValue = formData.get(input.name);
		const value = formDataEntryValue
			? formDataEntryValue.toString().trim()
			: "";

		if (input.required && value === "") {
			errors[input.name] = `${input.label} is required`;
			continue;
		}

		if (value === "") {
			values[input.name] = "";
			continue;
		}

		switch (input.type) {
			case "text":
			case "multiline-text":
				values[input.name] = value;
				break;
			case "number": {
				const numValue = Number(value);
				if (Number.isNaN(numValue)) {
					errors[input.name] = `${input.label} must be a valid number`;
				} else {
					values[input.name] = numValue;
				}
				break;
			}
			case "files": {
				const files = formData
					.getAll(input.name)
					.filter(
						(entry): entry is File => entry instanceof File && entry.size > 0,
					);

				if (input.required && files.length === 0) {
					errors[input.name] = `${input.label} is required`;
					break;
				}

				values[input.name] = files;
				break;
			}
			default: {
				const _exhaustiveCheck: never = input.type;
				throw new Error(`Unhandled input type: ${_exhaustiveCheck}`);
			}
		}
	}

	return { errors, values };
}

export async function toParameterItems(
	inputs: FormInput[],
	values: FormValues,
	options?: {
		workspaceId: WorkspaceId;
		uploadFile: (args: {
			workspaceId: WorkspaceId;
			fileId: FileId;
			fileName: string;
			file: File;
		}) => Promise<void>;
	},
): Promise<ParameterItem[]> {
	const items: ParameterItem[] = [];
	for (const input of inputs) {
		const value = values[input.name];
		if (value === undefined || value === "") {
			continue;
		}
		switch (input.type) {
			case "text":
			case "multiline-text":
				items.push({
					type: "string",
					name: input.name,
					value: value as string,
				});
				break;
			case "number":
				items.push({
					type: "number",
					name: input.name,
					value: value as number,
				});
				break;
			case "files": {
				if (!Array.isArray(value)) {
					break;
				}

				if (options === undefined) {
					throw new Error(
						"File upload options are required to submit file inputs.",
					);
				}

				const uploadedFiles: UploadedFileData[] = [];
				for (const file of value) {
					const uploadingFileData = createUploadingFileData({
						name: file.name,
						type: file.type || "application/octet-stream",
						size: file.size,
					});

					await options.uploadFile({
						workspaceId: options.workspaceId,
						fileId: uploadingFileData.id,
						fileName: file.name,
						file,
					});

					uploadedFiles.push(
						createUploadedFileData(uploadingFileData, Date.now()),
					);
				}

				items.push({
					type: "files",
					name: input.name,
					value: uploadedFiles,
				});
				break;
			}
			default: {
				const _exhaustiveCheck: never = input.type;
				throw new Error(`Unhandled input type: ${_exhaustiveCheck}`);
			}
		}
	}
	return items;
}


