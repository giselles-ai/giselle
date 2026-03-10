import { Button } from "@giselle-internal/ui/button";
import { Select } from "@giselle-internal/ui/select";
import {
	type Output as NodeOutput,
	OutputId,
	type Schema,
	type TextGenerationContent,
} from "@giselles-ai/protocol";
import { Braces, Plus } from "lucide-react";
import { StructuredOutputDialog } from "../structured-output/structured-output-dialog";

// Must match GENERATED_OBJECT_PROPERTY_ACCESSOR_PREFIX in
// packages/giselle/src/generations/utils.ts — this is how the generation layer
// knows which node outputs correspond to structured-output schema properties.
const PROPERTY_ACCESSOR_PREFIX = "generated-object-property:";

/**
 * Syncs node.outputs with structured-output schema properties.
 * - Preserves OutputId for properties that still exist (so downstream mentions survive edits).
 * - Returns the IDs of removed property outputs so the caller can clean up connections.
 */
export function syncStructuredOutputPropertyOutputs(
	currentOutputs: NodeOutput[],
	newOutput: TextGenerationContent["output"],
): { outputs: NodeOutput[]; removedOutputIds: OutputId[] } {
	const desiredPropertyNames =
		newOutput.format === "object"
			? Object.keys(newOutput.schema.properties)
			: [];

	const existingByName = new Map<string, NodeOutput>();
	for (const o of currentOutputs) {
		if (o.accessor.startsWith(PROPERTY_ACCESSOR_PREFIX)) {
			existingByName.set(o.accessor.slice(PROPERTY_ACCESSOR_PREFIX.length), o);
		}
	}

	const nextPropertyOutputs: NodeOutput[] = desiredPropertyNames.map(
		(name) =>
			existingByName.get(name) ?? {
				id: OutputId.generate(),
				label: name,
				accessor: `${PROPERTY_ACCESSOR_PREFIX}${name}`,
			},
	);

	const desiredSet = new Set(desiredPropertyNames);
	const removedOutputIds: OutputId[] = [];
	for (const [name, output] of existingByName) {
		if (!desiredSet.has(name)) {
			removedOutputIds.push(output.id);
		}
	}

	const nonPropertyOutputs = currentOutputs.filter(
		(o) => !o.accessor.startsWith(PROPERTY_ACCESSOR_PREFIX),
	);

	return {
		outputs: [...nonPropertyOutputs, ...nextPropertyOutputs],
		removedOutputIds,
	};
}

const outputFormatOptions = [
	{ value: "text", label: "Text" },
	{ value: "object", label: "JSON" },
];

const defaultSchema: Schema = {
	title: "response",
	type: "object",
	properties: {},
	required: [],
	additionalProperties: false,
};

type Output = TextGenerationContent["output"];

export function OutputFormatPanel({
	output,
	onOutputChange,
}: {
	output: Output;
	onOutputChange: (output: Output) => void;
}) {
	const hasOutputSchema = output.format === "object";
	const schemaObject = hasOutputSchema ? output.schema : defaultSchema;
	const isSchemaConfigured = Object.keys(schemaObject.properties).length > 0;

	return (
		<div className="flex flex-col items-end gap-[16px]">
			<Select
				options={outputFormatOptions}
				placeholder="Select format"
				value={output.format}
				onValueChange={(value) => {
					if (value === "object") {
						const schema = hasOutputSchema ? output.schema : defaultSchema;
						onOutputChange({ format: "object", schema });
					} else {
						onOutputChange({ format: "text" });
					}
				}}
				widthClassName="w-[100px]"
			/>
			{hasOutputSchema && (
				<div>
					<StructuredOutputDialog
						schema={schemaObject}
						onUpdate={(schema) => onOutputChange({ format: "object", schema })}
						trigger={
							isSchemaConfigured ? (
								<Button
									variant="solid"
									size="large"
									leftIcon={<Braces className="text-blue-300" />}
								>
									{schemaObject.title}
								</Button>
							) : (
								<Button variant="solid" size="large" leftIcon={<Plus />}>
									Set Schema
								</Button>
							)
						}
					/>
				</div>
			)}
		</div>
	);
}
