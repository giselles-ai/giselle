import type {
	CompletedGeneration,
	EndOutput,
	GenerationOutput,
	PropertyMapping,
	SubSchema,
} from "@giselles-ai/protocol";
import { dataQueryResultToText, queryResultToText } from "../generations/utils";

const pathSeparator = "\u0000";

type ObjectEndOutput = Extract<EndOutput, { format: "object" }>;

function toPathKey(path: string[]): string {
	return path.join(pathSeparator);
}

function parseJson(raw: string): unknown | undefined {
	try {
		return JSON.parse(raw);
	} catch {
		return undefined;
	}
}

function navigateObjectPath(value: unknown, path: string[]): unknown | undefined {
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

	if (targetSchema.type === "object" || targetSchema.type === "array") {
		return parseJson(rawText);
	}

	return rawText;
}

function buildFromSubSchema(params: {
	subSchema: SubSchema;
	path: string[];
	mappingsByPath: Map<string, PropertyMapping>;
	generationsByNodeId: Record<string, CompletedGeneration>;
}): unknown | undefined {
	const { subSchema, path, mappingsByPath, generationsByNodeId } = params;

	switch (subSchema.type) {
		case "string":
		case "number":
		case "boolean": {
			const mapping = mappingsByPath.get(toPathKey(path));
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
			const selfMapping = mappingsByPath.get(toPathKey(path));
			if (selfMapping) {
				return resolveValue({
					mapping: selfMapping,
					targetSchema: subSchema,
					generationsByNodeId,
				});
			}

			const result: Record<string, unknown> = {};
			for (const [key, childSchema] of Object.entries(subSchema.properties)) {
				const childValue = buildFromSubSchema({
					subSchema: childSchema,
					path: [...path, key],
					mappingsByPath,
					generationsByNodeId,
				});
				if (childValue !== undefined) {
					result[key] = childValue;
				}
			}
			return result;
		}
		case "array": {
			const mappingAtPath = mappingsByPath.get(toPathKey(path));
			if (mappingAtPath) {
				return resolveValue({
					mapping: mappingAtPath,
					targetSchema: subSchema,
					generationsByNodeId,
				});
			}

			const itemsPath = [...path, "items"];
			const mappingAtItemsPath = mappingsByPath.get(toPathKey(itemsPath));
			if (!mappingAtItemsPath) {
				// Known limitation: array item sub-property mappings are not handled.
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
	endNodeOutput: ObjectEndOutput,
	generationsByNodeId: Record<string, CompletedGeneration>,
): Record<string, unknown> {
	const mappingsByPath = new Map<string, PropertyMapping>();
	for (const mapping of endNodeOutput.mappings) {
		mappingsByPath.set(toPathKey(mapping.path), mapping);
	}

	const result: Record<string, unknown> = {};
	for (const [key, subSchema] of Object.entries(
		endNodeOutput.schema.properties,
	)) {
		const value = buildFromSubSchema({
			subSchema,
			path: [key],
			mappingsByPath,
			generationsByNodeId,
		});
		if (value !== undefined) {
			result[key] = value;
		}
	}
	return result;
}
