import type { App, Schema, SubSchema } from "@giselles-ai/protocol";

interface SchemaLibraryConfig {
	importLine: string;
	generateSchemaCode: (subSchema: SubSchema, indent: number) => string;
	formatSchemaDeclaration: (schemaCode: string) => string;
}

const INDENT_UNIT = "  ";

const validIdentifierPattern = /^[$A-Z_][0-9A-Z_$]*$/i;

function formatPropertyKey(key: string): string {
	return validIdentifierPattern.test(key) ? key : JSON.stringify(key);
}

function formatStringLiteral(value: string): string {
	return JSON.stringify(value);
}

// Use JSON.stringify for escaping, strip its double quotes, then escape single quotes for ArkType's single-quoted syntax.
function formatArkTypeLiteral(value: string): string {
	return `'${JSON.stringify(value).slice(1, -1).replace(/'/g, "\\'")}'`;
}

const defaultSchemaDeclaration = (schemaCode: string) =>
	`const schema = ${schemaCode};`;

const schemaLibraries = {
	zod: {
		importLine: 'import { z } from "zod";',
		generateSchemaCode: generateZodCode,
		formatSchemaDeclaration: defaultSchemaDeclaration,
	},
	valibot: {
		importLine: 'import * as v from "valibot";',
		generateSchemaCode: generateValibotCode,
		formatSchemaDeclaration: defaultSchemaDeclaration,
	},
	arktype: {
		importLine: 'import { type } from "arktype";',
		generateSchemaCode: generateArkTypeCode,
		formatSchemaDeclaration: defaultSchemaDeclaration,
	},
	yup: {
		importLine: 'import * as y from "yup";',
		generateSchemaCode: generateYupCode,
		formatSchemaDeclaration: defaultSchemaDeclaration,
	},
	effect: {
		importLine: 'import { Schema as S } from "effect";',
		generateSchemaCode: generateEffectSchemaCode,
		formatSchemaDeclaration: (schemaCode: string) =>
			`const effectSchema = ${schemaCode};\nconst schema = S.standardSchemaV1(effectSchema);`,
	},
} satisfies Record<string, SchemaLibraryConfig>;

export type SchemaLibrary = keyof typeof schemaLibraries;

function generateExampleValue(subSchema: SubSchema): unknown {
	switch (subSchema.type) {
		case "string":
			return subSchema.enum && subSchema.enum.length > 0
				? subSchema.enum[0]
				: "string";
		case "number":
			return 0;
		case "boolean":
			return true;
		case "object": {
			const obj: Record<string, unknown> = {};
			for (const [key, childSchema] of Object.entries(subSchema.properties)) {
				obj[key] = generateExampleValue(childSchema);
			}
			return obj;
		}
		case "array":
			return [generateExampleValue(subSchema.items)];
		default: {
			const _exhaustiveCheck: never = subSchema;
			throw new Error(`Unhandled schema type: ${_exhaustiveCheck}`);
		}
	}
}

function generateExampleResponse(schema: Schema): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const [key, subSchema] of Object.entries(schema.properties)) {
		result[key] = generateExampleValue(subSchema);
	}
	return result;
}

function generateZodCode(subSchema: SubSchema, indent: number): string {
	const pad = INDENT_UNIT.repeat(indent);
	switch (subSchema.type) {
		case "string":
			if (subSchema.enum && subSchema.enum.length > 0) {
				const values = subSchema.enum
					.map((v) => formatStringLiteral(v))
					.join(", ");
				return `z.enum([${values}])`;
			}
			return "z.string()";
		case "number":
			return "z.number()";
		case "boolean":
			return "z.boolean()";
		case "object": {
			const entries = Object.entries(subSchema.properties);
			if (entries.length === 0) {
				return "z.object({})";
			}
			const fields = entries
				.map(
					([key, value]) =>
						`${pad}${INDENT_UNIT}${formatPropertyKey(key)}: ${generateZodCode(value, indent + 1)},`,
				)
				.join("\n");
			return `z.object({\n${fields}\n${pad}})`;
		}
		case "array":
			return `z.array(${generateZodCode(subSchema.items, indent)})`;
		default: {
			const _exhaustiveCheck: never = subSchema;
			throw new Error(`Unhandled schema type: ${_exhaustiveCheck}`);
		}
	}
}

function generateValibotCode(subSchema: SubSchema, indent: number): string {
	const pad = INDENT_UNIT.repeat(indent);
	switch (subSchema.type) {
		case "string":
			if (subSchema.enum && subSchema.enum.length > 0) {
				const values = subSchema.enum
					.map((v) => formatStringLiteral(v))
					.join(", ");
				return `v.picklist([${values}])`;
			}
			return "v.string()";
		case "number":
			return "v.number()";
		case "boolean":
			return "v.boolean()";
		case "object": {
			const entries = Object.entries(subSchema.properties);
			if (entries.length === 0) {
				return "v.object({})";
			}
			const fields = entries
				.map(
					([key, value]) =>
						`${pad}${INDENT_UNIT}${formatPropertyKey(key)}: ${generateValibotCode(value, indent + 1)},`,
				)
				.join("\n");
			return `v.object({\n${fields}\n${pad}})`;
		}
		case "array":
			return `v.array(${generateValibotCode(subSchema.items, indent)})`;
		default: {
			const _exhaustiveCheck: never = subSchema;
			throw new Error(`Unhandled schema type: ${_exhaustiveCheck}`);
		}
	}
}

function generateArkTypeCode(subSchema: SubSchema, indent: number): string {
	const pad = INDENT_UNIT.repeat(indent);
	switch (subSchema.type) {
		case "string":
			if (subSchema.enum && subSchema.enum.length > 0) {
				const values = subSchema.enum
					.map((v) => formatArkTypeLiteral(v))
					.join(" | ");
				return `"${values}"`;
			}
			return '"string"';
		case "number":
			return '"number"';
		case "boolean":
			return '"boolean"';
		case "object": {
			const entries = Object.entries(subSchema.properties);
			if (entries.length === 0) {
				return "type({})";
			}
			const fields = entries
				.map(
					([key, value]) =>
						`${pad}${INDENT_UNIT}${formatPropertyKey(key)}: ${generateArkTypeCode(value, indent + 1)},`,
				)
				.join("\n");
			return `type({\n${fields}\n${pad}})`;
		}
		case "array": {
			const itemCode = generateArkTypeCode(subSchema.items, indent);
			if (itemCode.startsWith("type(")) {
				return `${itemCode}.array()`;
			}
			if (itemCode.includes("|")) {
				return `type(${itemCode}).array()`;
			}
			return `${itemCode.slice(0, -1)}[]"`;
		}
		default: {
			const _exhaustiveCheck: never = subSchema;
			throw new Error(`Unhandled schema type: ${_exhaustiveCheck}`);
		}
	}
}

function generateYupCode(subSchema: SubSchema, indent: number): string {
	const pad = INDENT_UNIT.repeat(indent);
	switch (subSchema.type) {
		case "string":
			if (subSchema.enum && subSchema.enum.length > 0) {
				const values = subSchema.enum
					.map((v) => formatStringLiteral(v))
					.join(", ");
				return `y.string().oneOf([${values}]).required()`;
			}
			return "y.string().required()";
		case "number":
			return "y.number().required()";
		case "boolean":
			return "y.boolean().required()";
		case "object": {
			const entries = Object.entries(subSchema.properties);
			if (entries.length === 0) {
				return "y.object({}).required()";
			}
			const fields = entries
				.map(
					([key, value]) =>
						`${pad}${INDENT_UNIT}${formatPropertyKey(key)}: ${generateYupCode(value, indent + 1)},`,
				)
				.join("\n");
			return `y.object({\n${fields}\n${pad}}).required()`;
		}
		case "array":
			return `y.array().of(${generateYupCode(subSchema.items, indent)}).required()`;
		default: {
			const _exhaustiveCheck: never = subSchema;
			throw new Error(`Unhandled schema type: ${_exhaustiveCheck}`);
		}
	}
}

function generateEffectSchemaCode(
	subSchema: SubSchema,
	indent: number,
): string {
	const pad = INDENT_UNIT.repeat(indent);
	switch (subSchema.type) {
		case "string":
			if (subSchema.enum && subSchema.enum.length > 0) {
				const values = subSchema.enum
					.map((v) => formatStringLiteral(v))
					.join(", ");
				return `S.Literal(${values})`;
			}
			return "S.String";
		case "number":
			return "S.Number";
		case "boolean":
			return "S.Boolean";
		case "object": {
			const entries = Object.entries(subSchema.properties);
			if (entries.length === 0) {
				return "S.Struct({})";
			}
			const fields = entries
				.map(
					([key, value]) =>
						`${pad}${INDENT_UNIT}${formatPropertyKey(key)}: ${generateEffectSchemaCode(value, indent + 1)},`,
				)
				.join("\n");
			return `S.Struct({\n${fields}\n${pad}})`;
		}
		case "array":
			return `S.Array(${generateEffectSchemaCode(subSchema.items, indent)})`;
		default: {
			const _exhaustiveCheck: never = subSchema;
			throw new Error(`Unhandled schema type: ${_exhaustiveCheck}`);
		}
	}
}

export function generateApiSampleCodeWithResponse(
	app: App,
	schema: Schema,
	library: SchemaLibrary,
): string {
	const { importLine, generateSchemaCode, formatSchemaDeclaration } =
		schemaLibraries[library];
	const schemaCode = generateSchemaCode(
		{
			type: "object",
			properties: schema.properties,
			required: schema.required,
			additionalProperties: false,
		},
		0,
	);
	const schemaDeclaration = formatSchemaDeclaration(schemaCode);

	return `\`\`\`typescript
import Giselle from "@giselles-ai/sdk";
${importLine}

const client = new Giselle({
  apiKey: process.env.GISELLE_API_KEY,
});

${schemaDeclaration}

const { task } = await client.apps.runAndWait({
  appId: "${app.id}",
  input: { text: "your input here" },
  schema,
});

if (task.status === "completed" && task.outputType === "object") {
  console.log(task.output);
}
\`\`\`

**Response**

\`\`\`json
${JSON.stringify(generateExampleResponse(schema), null, 2)}
\`\`\``;
}

export function generateApiSampleCode(app: App): string {
	return `\`\`\`typescript
import Giselle from "@giselles-ai/sdk";

const client = new Giselle({
  apiKey: process.env.GISELLE_API_KEY,
});

const { taskId } = await client.apps.run({
  appId: "${app.id}",
  input: { text: "your input here" },
});

console.log(taskId);
\`\`\``;
}
