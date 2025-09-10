import type { FlowTrigger } from "@giselle-sdk/data-type";
import type { ParameterItem } from "@giselle-sdk/giselle";
import type { FormInput, FormValues, ValidationErrors } from "./types";

/**
 * This code is based on internal-packages/workflow-designer-ui/src/header/ui/trigger-input-dialog/helpers.ts
 */

export function createInputsFromTrigger(
	trigger: FlowTrigger | undefined,
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
			default: {
				const _exhaustiveCheck: never = input.type;
				throw new Error(`Unhandled input type: ${_exhaustiveCheck}`);
			}
		}
	}

	return { errors, values };
}

export function toParameterItems(
	inputs: FormInput[],
	values: FormValues,
): ParameterItem[] {
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
			default: {
				const _exhaustiveCheck: never = input.type;
				throw new Error(`Unhandled input type: ${_exhaustiveCheck}`);
			}
		}
	}
	return items;
}
