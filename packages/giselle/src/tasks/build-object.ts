import type {
	CompletedGeneration,
	EndOutput,
	GenerationOutput,
	NodeId,
	PropertyMapping,
	SubSchema,
} from "@giselles-ai/protocol";
import { dataQueryResultToText, queryResultToText } from "../generations/utils";

function isEqualPath(a: string[], b: string[]): boolean {
	if (a.length !== b.length) return false;
	return a.every((segment, i) => segment === b[i]);
}

function findMappingAtSchemaPath(
	mappings: PropertyMapping[],
	schemaPath: string[],
): PropertyMapping | undefined {
	return mappings.find((m) => isEqualPath(m.path, schemaPath));
}

function parseJson(raw: string): unknown | undefined {
	try {
		return JSON.parse(raw);
	} catch {
		return undefined;
	}
}

function navigateObjectPath(
	value: unknown,
	path: string[],
): unknown | undefined {
	let current: unknown = value;
	for (const segment of path) {
		// Navigating into array element properties is not supported
		if (Array.isArray(current)) {
			return undefined;
		}
		if (current === null || typeof current !== "object") {
			return undefined;
		}
		const record = current as Record<string, unknown>;
		if (!(segment in record)) {
			return undefined;
		}
		current = record[segment];
	}
	return current;
}

function getRawTextFromOutput(output: GenerationOutput): string | undefined {
	switch (output.type) {
		case "generated-text":
		case "reasoning":
			return output.content;
		case "query-result":
			return queryResultToText(output);
		case "data-query-result":
			return dataQueryResultToText(output);
		case "generated-image":
		case "source":
			return undefined;
		default: {
			const _exhaustive: never = output;
			throw new Error(`Unhandled generation output type: ${_exhaustive}`);
		}
	}
}

function coerceToSubSchema(
	value: unknown,
	targetSchema: SubSchema,
): unknown | undefined {
	if (value === undefined) return undefined;

	switch (targetSchema.type) {
		case "object":
			return value !== null &&
				typeof value === "object" &&
				!Array.isArray(value)
				? value
				: undefined;
		case "array":
			return Array.isArray(value) ? value : undefined;
		case "number": {
			if (typeof value === "number") {
				return Number.isNaN(value) ? undefined : value;
			}
			if (typeof value === "string") {
				if (value === "") return undefined;
				const num = Number(value);
				return Number.isNaN(num) ? undefined : num;
			}
			return undefined;
		}
		case "boolean":
			if (typeof value === "boolean") return value;
			if (value === "true") return true;
			if (value === "false") return false;
			return undefined;
		case "string":
			if (typeof value === "string") return value;
			return undefined;
	}
}

function resolveValue(params: {
	mapping: PropertyMapping;
	targetSchema: SubSchema;
	generationsByNodeId: Record<NodeId, CompletedGeneration>;
}): unknown | undefined {
	const { mapping, targetSchema, generationsByNodeId } = params;
	const generation = generationsByNodeId[mapping.source.nodeId];
	if (!generation) {
		return undefined;
	}

	const output = generation.outputs.find(
		(item) => item.outputId === mapping.source.outputId,
	);
	if (!output) {
		return undefined;
	}

	const rawText = getRawTextFromOutput(output);
	if (rawText === undefined) {
		return undefined;
	}

	if (mapping.source.path.length > 0) {
		const parsed = parseJson(rawText);
		if (parsed === undefined) {
			return undefined;
		}
		const extracted = navigateObjectPath(parsed, mapping.source.path);
		return coerceToSubSchema(extracted, targetSchema);
	}

	switch (targetSchema.type) {
		case "object":
		case "array": {
			const parsed = parseJson(rawText);
			return coerceToSubSchema(parsed, targetSchema);
		}
		case "number":
		case "boolean":
		case "string":
			return coerceToSubSchema(rawText, targetSchema);
	}
}

function buildValueFromSubSchema(params: {
	subSchema: SubSchema;
	schemaPath: string[];
	mappings: PropertyMapping[];
	generationsByNodeId: Record<NodeId, CompletedGeneration>;
}): unknown | undefined {
	const { subSchema, schemaPath, mappings, generationsByNodeId } = params;

	switch (subSchema.type) {
		case "string":
		case "number":
		case "boolean": {
			const mapping = findMappingAtSchemaPath(mappings, schemaPath);
			if (!mapping) {
				return undefined;
			}
			return resolveValue({
				mapping,
				targetSchema: subSchema,
				generationsByNodeId,
			});
		}
		case "object": {
			const mapping = findMappingAtSchemaPath(mappings, schemaPath);
			if (mapping) {
				return resolveValue({
					mapping,
					targetSchema: subSchema,
					generationsByNodeId,
				});
			}

			const result: Record<string, unknown> = {};
			for (const [key, childSchema] of Object.entries(subSchema.properties)) {
				const childValue = buildValueFromSubSchema({
					subSchema: childSchema,
					schemaPath: [...schemaPath, key],
					mappings,
					generationsByNodeId,
				});
				if (childValue !== undefined) {
					result[key] = childValue;
				}
			}
			if (Object.keys(result).length === 0) {
				return undefined;
			}
			return result;
		}
		case "array": {
			const mapping = findMappingAtSchemaPath(mappings, schemaPath);
			if (mapping) {
				return resolveValue({
					mapping,
					targetSchema: subSchema,
					generationsByNodeId,
				});
			}

			const itemsSchemaPath = [...schemaPath, "items"];
			const itemsMapping = findMappingAtSchemaPath(mappings, itemsSchemaPath);
			if (!itemsMapping) {
				return undefined;
			}
			return resolveValue({
				mapping: itemsMapping,
				targetSchema: subSchema,
				generationsByNodeId,
			});
		}
		default: {
			const _exhaustive: never = subSchema;
			throw new Error(`Unhandled schema type: ${_exhaustive}`);
		}
	}
}

export function buildObject(
	endNodeOutput: Extract<EndOutput, { format: "object" }>,
	generationsByNodeId: Record<NodeId, CompletedGeneration>,
): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const [key, subSchema] of Object.entries(
		endNodeOutput.schema.properties,
	)) {
		const value = buildValueFromSubSchema({
			subSchema,
			schemaPath: [key],
			mappings: endNodeOutput.mappings,
			generationsByNodeId,
		});
		if (value !== undefined) {
			result[key] = value;
		}
	}
	return result;
}
