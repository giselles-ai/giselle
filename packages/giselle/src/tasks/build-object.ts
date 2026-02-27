import type {
	CompletedGeneration,
	EndOutput,
	GenerationOutput,
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
			return queryResultToText(output) ?? "";
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

function resolveValue(params: {
	mapping: PropertyMapping;
	targetSchema: SubSchema;
	generationsByNodeId: Record<string, CompletedGeneration>;
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
		return navigateObjectPath(parsed, mapping.source.path);
	}

	switch (targetSchema.type) {
		case "object":
		case "array":
			return parseJson(rawText);
		case "number": {
			const num = Number(rawText);
			return Number.isNaN(num) ? undefined : num;
		}
		case "boolean":
			if (rawText === "true") return true;
			if (rawText === "false") return false;
			return undefined;
		case "string":
			return rawText;
	}
}

function buildValueFromSubSchema(params: {
	subSchema: SubSchema;
	schemaPath: string[];
	mappings: PropertyMapping[];
	generationsByNodeId: Record<string, CompletedGeneration>;
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
			const directMapping = findMappingAtSchemaPath(mappings, schemaPath);
			if (directMapping) {
				return resolveValue({
					mapping: directMapping,
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
			return result;
		}
		case "array": {
			const mappingAtPath = findMappingAtSchemaPath(mappings, schemaPath);
			if (mappingAtPath) {
				return resolveValue({
					mapping: mappingAtPath,
					targetSchema: subSchema,
					generationsByNodeId,
				});
			}

			const itemsSchemaPath = [...schemaPath, "items"];
			const mappingAtItemsPath = findMappingAtSchemaPath(
				mappings,
				itemsSchemaPath,
			);
			if (!mappingAtItemsPath) {
				return undefined;
			}
			return resolveValue({
				mapping: mappingAtItemsPath,
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
	generationsByNodeId: Record<string, CompletedGeneration>,
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
