"use client";

import {
	autocompletion,
	type CompletionContext,
	closeBrackets,
	closeBracketsKeymap,
} from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { json } from "@codemirror/lang-json";
import {
	bracketMatching,
	indentOnInput,
	syntaxHighlighting,
} from "@codemirror/language";
import { type Diagnostic, linter } from "@codemirror/lint";
import { EditorState, type Range } from "@codemirror/state";
import { oneDarkHighlightStyle } from "@codemirror/theme-one-dark";
import {
	Decoration,
	type DecorationSet,
	drawSelection,
	dropCursor,
	EditorView,
	highlightActiveLine,
	keymap,
	placeholder,
	ViewPlugin,
	type ViewUpdate,
	WidgetType,
} from "@codemirror/view";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@giselle-internal/ui/dialog";
import { HighlightedJson } from "@giselle-internal/workflow-designer-ui";
import { type ReactNode, useCallback, useMemo, useRef, useState } from "react";

/**
 * Create a completion source triggered by `@`.
 * Typing `@` shows all suggestions; continuing to type filters them.
 * Selecting a suggestion replaces `@` + typed text with the value.
 */
interface Suggestion {
	label: string;
	apply: string;
}

function createCompletionSource(suggestions: Suggestion[]) {
	return (context: CompletionContext) => {
		const match = context.matchBefore(/@\w*/);
		if (!match) return null;

		const filterText = match.text.slice(1).toLowerCase();
		const filtered = suggestions
			.filter((s) => s.label.toLowerCase().includes(filterText))
			.map((s) => ({
				label: s.label,
				type: "text",
				apply: s.apply,
			}));

		return {
			from: match.from,
			options: filtered,
			filter: false,
		};
	};
}

/**
 * Sample variable map: label → resolved value (JSON Schema string).
 * Each value must be a JSON Schema of type "object" with "properties".
 */
const SAMPLE_VARIABLES: Record<string, string> = {
	"Title Generator / Schema":
		'{ "type": "object", "properties": { "title": { "type": "string" } }, "required": ["title"] }',
	"Blog Generator / Schema":
		'{ "type": "object", "properties": { "summary": { "type": "string" }, "content": { "type": "string" } }, "required": ["summary", "content"] }',
};

const VARIABLE_SUGGESTIONS: Suggestion[] = [
	...Object.keys(SAMPLE_VARIABLES).map((key) => ({
		label: key,
		apply: `{{${key}}}`,
	})),
];

/**
 * Replace {{var}} with "__MERGE_N__": "__PLACEHOLDER_N__" key-value pairs
 * to make the text parseable as valid JSON.
 * Used by formatEditor, jsonLinter, and mergeReferencedSchemas.
 */
function replaceVariablesForParsing(text: string): {
	safeJson: string;
	variableNames: string[];
} {
	const variableNames: string[] = [];
	const safeJson = text.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => {
		const index = variableNames.length;
		variableNames.push(key);
		return `"__MERGE_${index}__": "__PLACEHOLDER_${index}__"`;
	});
	return { safeJson, variableNames };
}

/**
 * Reverse the preprocess: restore "__MERGE_N__": "__PLACEHOLDER_N__" back to {{var}}.
 */
function restoreVariables(text: string, variableNames: string[]): string {
	let result = text;
	for (let i = 0; i < variableNames.length; i++) {
		result = result.replace(
			`"__MERGE_${i}__": "__PLACEHOLDER_${i}__"`,
			`{{${variableNames[i]}}}`,
		);
	}
	return result;
}

/**
 * Merge result: either a successfully merged schema or an error message.
 */
type MergeResult =
	| { ok: true; schema: Record<string, unknown> }
	| { ok: false; error: string };

/**
 * Recursively process a schema node: if it has type "object" with properties,
 * merge any __MERGE_N__ keys and recurse into regular property values.
 */
function processSchemaNode(
	node: Record<string, unknown>,
	variableNames: string[],
	variables: Record<string, string>,
): MergeResult {
	if (
		!node.properties ||
		typeof node.properties !== "object" ||
		Array.isArray(node.properties)
	) {
		return { ok: true, schema: node };
	}

	const parentProperties = node.properties as Record<string, unknown>;
	const parentRequired = Array.isArray(node.required)
		? ([...node.required] as string[])
		: [];

	const mergedProperties: Record<string, unknown> = {};
	const mergedRequired: string[] = [...parentRequired];
	const keySource: Record<string, string> = {};

	for (const [key, value] of Object.entries(parentProperties)) {
		const mergeMatch = key.match(/^__MERGE_(\d+)__$/);
		if (mergeMatch) {
			const index = Number(mergeMatch[1]);
			const variableName = variableNames[index];
			const variableValue = variables[variableName];

			if (variableValue == null) {
				return {
					ok: false,
					error: `Variable "${variableName}" is not defined`,
				};
			}

			let refSchema: Record<string, unknown>;
			try {
				refSchema = JSON.parse(variableValue);
			} catch {
				return {
					ok: false,
					error: `Variable "${variableName}" is not valid JSON`,
				};
			}

			if (refSchema.type !== "object" || !refSchema.properties) {
				return {
					ok: false,
					error: `"${variableName}" must be type: "object" with properties`,
				};
			}

			const refProperties = refSchema.properties as Record<string, unknown>;
			const refRequired = Array.isArray(refSchema.required)
				? (refSchema.required as string[])
				: [];

			for (const refKey of Object.keys(refProperties)) {
				if (refKey in mergedProperties) {
					const conflictSource = keySource[refKey] ?? "parent schema";
					return {
						ok: false,
						error: `Key "${refKey}" conflicts between "${variableName}" and "${conflictSource}"`,
					};
				}
				mergedProperties[refKey] = refProperties[refKey];
				keySource[refKey] = variableName;
			}

			for (const req of refRequired) {
				if (!mergedRequired.includes(req)) {
					mergedRequired.push(req);
				}
			}
		} else {
			if (key in mergedProperties) {
				const conflictSource = keySource[key] ?? "parent schema";
				return {
					ok: false,
					error: `Key "${key}" conflicts between parent schema and "${conflictSource}"`,
				};
			}

			// Recurse into nested objects to handle deeply nested {{var}}
			if (
				typeof value === "object" &&
				value !== null &&
				!Array.isArray(value)
			) {
				const recursed = processSchemaNode(
					value as Record<string, unknown>,
					variableNames,
					variables,
				);
				if (!recursed.ok) return recursed;
				mergedProperties[key] = recursed.schema;
			} else {
				mergedProperties[key] = value;
			}
			keySource[key] = "parent schema";
		}
	}

	const mergedSchema: Record<string, unknown> = {
		...node,
		properties: mergedProperties,
	};

	if (mergedRequired.length > 0) {
		mergedSchema.required = mergedRequired;
	} else {
		delete mergedSchema.required;
	}

	return { ok: true, schema: mergedSchema };
}

/**
 * Parse editor text, resolve {{variable}} references, extract their properties,
 * and merge them flat into the parent schema.
 * Recursively processes nested objects so {{var}} works at any depth.
 * Key conflicts are reported as errors.
 * Required arrays are unified.
 */
function mergeReferencedSchemas(
	text: string,
	variables: Record<string, string>,
): MergeResult {
	try {
		const { safeJson, variableNames } = replaceVariablesForParsing(text);
		const parsed = JSON.parse(safeJson);

		if (
			typeof parsed !== "object" ||
			parsed === null ||
			parsed.type !== "object"
		) {
			return {
				ok: false,
				error: 'Top-level schema must be type: "object"',
			};
		}

		return processSchemaNode(parsed, variableNames, variables);
	} catch {
		return { ok: false, error: "Invalid JSON" };
	}
}

const STRING_FORMAT_SAMPLES: Record<string, string> = {
	"date-time": "2026-01-01T00:00:00Z",
	date: "2026-01-01",
	time: "12:00:00Z",
	email: "user@example.com",
	uri: "https://example.com",
	url: "https://example.com",
	uuid: "550e8400-e29b-41d4-a716-446655440000",
	ipv4: "192.0.2.1",
	ipv6: "2001:db8::1",
};

/**
 * Generate a sample JSON value from a JSON Schema.
 */
function generateSampleFromSchema(schema: unknown): unknown {
	if (schema == null || typeof schema !== "object") return null;

	const s = schema as Record<string, unknown>;

	if ("default" in s && !(Array.isArray(s.default) && s.default.length === 0)) {
		return s.default;
	}

	if (Array.isArray(s.enum) && s.enum.length > 0) return s.enum[0];

	switch (s.type) {
		case "object": {
			const result: Record<string, unknown> = {};
			if (
				s.properties != null &&
				typeof s.properties === "object" &&
				!Array.isArray(s.properties)
			) {
				for (const [key, propSchema] of Object.entries(
					s.properties as Record<string, unknown>,
				)) {
					result[key] = generateSampleFromSchema(propSchema);
				}
			}
			return result;
		}
		case "array": {
			const itemSample = s.items ? generateSampleFromSchema(s.items) : null;
			return itemSample != null ? [itemSample] : [];
		}
		case "string": {
			if (typeof s.format === "string" && s.format in STRING_FORMAT_SAMPLES) {
				return STRING_FORMAT_SAMPLES[s.format];
			}
			if (typeof s.description === "string" && s.description.length > 0) {
				return s.description;
			}
			return "sample text";
		}
		case "number":
		case "integer":
			return 0;
		case "boolean":
			return false;
		case "null":
			return null;
		default:
			return null;
	}
}

/**
 * Merge referenced schemas, then generate a sample JSON from the merged schema.
 */
function generateSampleJson(
	text: string,
	variables: Record<string, string>,
): string {
	const result = mergeReferencedSchemas(text, variables);
	if (!result.ok) return `Error: ${result.error}`;
	const sample = generateSampleFromSchema(result.schema);
	return JSON.stringify(sample, null, 2);
}

/** Pattern to detect mentions: {{name}} */
const MENTION_RE = /\{\{([^}]+)\}\}/g;

class MentionWidget extends WidgetType {
	constructor(readonly name: string) {
		super();
	}

	toDOM() {
		const chip = document.createElement("span");
		chip.className = "cm-mention-chip";
		chip.textContent = this.name;
		return chip;
	}

	ignoreEvent() {
		return false;
	}
}

function buildMentionDecorations(view: EditorView): DecorationSet {
	const decorations: Range<Decoration>[] = [];

	for (const { from, to } of view.visibleRanges) {
		const text = view.state.doc.sliceString(from, to);
		MENTION_RE.lastIndex = 0;

		for (let m = MENTION_RE.exec(text); m !== null; m = MENTION_RE.exec(text)) {
			const start = from + m.index;
			const end = start + m[0].length;
			decorations.push(
				Decoration.replace({
					widget: new MentionWidget(m[1]),
				}).range(start, end),
			);
		}
	}

	return Decoration.set(decorations);
}

const mentionPlugin = ViewPlugin.fromClass(
	class {
		decorations: DecorationSet;
		constructor(view: EditorView) {
			this.decorations = buildMentionDecorations(view);
		}
		update(update: ViewUpdate) {
			if (update.docChanged || update.viewportChanged) {
				this.decorations = buildMentionDecorations(update.view);
			}
		}
	},
	{ decorations: (v) => v.decorations },
);

const mentionAtomicRanges = EditorView.atomicRanges.of((view) => {
	return view.plugin(mentionPlugin)?.decorations ?? Decoration.none;
});

const mentionChipStyle = EditorView.theme({
	".cm-mention-chip": {
		display: "inline-block",
		padding: "1px 8px",
		borderRadius: "4px",
		backgroundColor: "rgba(139,92,246,0.25)",
		color: "#c4b5fd",
		fontSize: "13px",
		fontFamily: "inherit",
		verticalAlign: "baseline",
		cursor: "default",
	},
});

/**
 * JSON linter that handles {{variable}} placeholders.
 * Uses replaceVariablesForParsing to convert keyless {{var}} into valid key-value pairs,
 * then parses to check for syntax errors.
 */
const jsonLinter = linter((view) => {
	const diagnostics: Diagnostic[] = [];
	const doc = view.state.doc.toString();
	const { safeJson } = replaceVariablesForParsing(doc);

	try {
		JSON.parse(safeJson);
	} catch (e) {
		if (e instanceof SyntaxError) {
			const posMatch = e.message.match(/position\s+(\d+)/i);
			const pos = posMatch ? Number(posMatch[1]) : 0;
			const from = Math.min(pos, doc.length);
			const to = Math.min(from + 1, doc.length);

			diagnostics.push({
				from,
				to,
				severity: "error",
				message: e.message,
			});
		}
	}

	return diagnostics;
});

const lintStyle = EditorView.theme({
	".cm-diagnostic-error": {
		color: "#f87171",
		borderLeft: "3px solid #f87171",
		paddingLeft: "8px",
		fontSize: "12px",
	},
	".cm-lint-marker-error": {
		content: '""',
	},
});

const SAMPLE_SCHEMA = `{
  "type": "object",
  "properties": {
    {{Title Generator / Schema}},
    {{Blog Generator / Schema}}
  }
}`;

const darkTheme = EditorView.theme(
	{
		"&": {
			backgroundColor: "rgba(0,0,0,0.3)",
			color: "#e4e4e7",
			borderRadius: "8px",
			minHeight: "200px",
			fontSize: "14px",
		},
		".cm-content": {
			caretColor: "#e4e4e7",
			fontFamily:
				'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
		},
		".cm-cursor": { borderLeftColor: "#e4e4e7" },
		".cm-gutters": {
			backgroundColor: "transparent",
			color: "rgba(255,255,255,0.3)",
			border: "none",
		},
		".cm-activeLineGutter": {
			backgroundColor: "rgba(255,255,255,0.05)",
		},
		".cm-activeLine": {
			backgroundColor: "rgba(255,255,255,0.05)",
		},
		".cm-selectionBackground": {
			backgroundColor: "rgba(255,255,255,0.15) !important",
		},
		".cm-focused .cm-selectionBackground": {
			backgroundColor: "rgba(255,255,255,0.2) !important",
		},
		".cm-tooltip": {
			backgroundColor: "#1e1e2e",
			border: "1px solid rgba(255,255,255,0.1)",
		},
		".cm-tooltip-autocomplete ul li": {
			color: "#e4e4e7",
		},
		".cm-tooltip-autocomplete ul li[aria-selected]": {
			backgroundColor: "rgba(255,255,255,0.15)",
			color: "#fff",
		},
	},
	{ dark: true },
);

type StructuredOutputDialogProps = {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
};

function StructuredOutputDialog({
	isOpen,
	onOpenChange,
	title,
	description,
}: StructuredOutputDialogProps) {
	const [code, setCode] = useState(SAMPLE_SCHEMA);
	const viewRef = useRef<EditorView | null>(null);

	const handleChange = useCallback((value: string) => {
		setCode(value);
	}, []);

	const formatEditor = useCallback((view: EditorView) => {
		try {
			const raw = view.state.doc.toString();
			const { safeJson, variableNames } = replaceVariablesForParsing(raw);

			const parsed = JSON.parse(safeJson);
			const formatted = restoreVariables(
				JSON.stringify(parsed, null, 2),
				variableNames,
			);

			view.dispatch({
				changes: {
					from: 0,
					to: view.state.doc.length,
					insert: formatted,
				},
				selection: { anchor: 0 },
			});
		} catch {
			// Do nothing if JSON is invalid
		}
	}, []);

	const editorContainerRef = useCallback(
		(node: HTMLDivElement | null) => {
			// Clean up previous editor
			if (viewRef.current) {
				viewRef.current.destroy();
				viewRef.current = null;
			}
			if (!node) return;

			const updateListener = EditorView.updateListener.of((update) => {
				if (update.docChanged) {
					handleChange(update.state.doc.toString());
				}
			});

			const view = new EditorView({
				state: EditorState.create({
					doc: SAMPLE_SCHEMA,
					extensions: [
						history(),
						drawSelection(),
						dropCursor(),
						indentOnInput(),
						syntaxHighlighting(oneDarkHighlightStyle),
						bracketMatching(),
						closeBrackets(),
						highlightActiveLine(),
						keymap.of([
							...closeBracketsKeymap,
							...defaultKeymap,
							...historyKeymap,
							{
								key: "Mod-s",
								run: (v) => {
									formatEditor(v);
									return true;
								},
							},
						]),
						json(),
						autocompletion({
							override: [createCompletionSource(VARIABLE_SUGGESTIONS)],
						}),
						mentionPlugin,
						mentionAtomicRanges,
						mentionChipStyle,
						jsonLinter,
						lintStyle,
						darkTheme,
						placeholder("Type JSON Schema here..."),
						updateListener,
					],
				}),
				parent: node,
			});
			viewRef.current = view;
		},
		[handleChange, formatEditor],
	);

	const handleFormat = useCallback(() => {
		if (viewRef.current) {
			formatEditor(viewRef.current);
		}
	}, [formatEditor]);

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent
				variant="glass"
				size="full"
				className="h-[95vh]"
				onOpenAutoFocus={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle className="text-[20px] font-semibold text-white-900">
						{title}
					</DialogTitle>
					<DialogDescription className="font-geist mt-2 text-[14px] text-text-muted">
						{description}
					</DialogDescription>
				</DialogHeader>
				<DialogBody className="mt-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="rounded-lg border border-white/10 bg-white/5 p-4 flex flex-col">
							<div className="flex justify-between mb-2">
								<button
									type="button"
									onClick={() => {
										const view = viewRef.current;
										if (!view) return;
										view.dispatch({
											changes: {
												from: 0,
												to: view.state.doc.length,
												insert: SAMPLE_SCHEMA,
											},
											selection: { anchor: 0 },
										});
									}}
									className="rounded-md border border-error-900/40 px-4 py-1.5 text-[14px] font-medium text-error-900 hover:text-error-200 hover:bg-error-900/10 transition-colors"
								>
									Reset
								</button>
								<button
									type="button"
									onClick={handleFormat}
									className="rounded-md border border-white/20 px-4 py-1.5 text-[14px] font-medium text-inverse/80 hover:text-inverse hover:bg-white/10 transition-colors"
								>
									Format
									<kbd className="ml-2 text-[15px] text-inverse/40">⌘ S</kbd>
								</button>
							</div>
							<div ref={editorContainerRef} className="flex-1 min-h-0" />
						</div>
						<div className="rounded-lg border border-white/10 bg-white/5 p-4 flex flex-col">
							<div className="flex items-center mb-2 min-h-[34px]">
								<span className="text-[11px] text-text/40">Merged Schema</span>
							</div>
							{(() => {
								const result = mergeReferencedSchemas(code, SAMPLE_VARIABLES);
								if (!result.ok) {
									return (
										<pre className="rounded-[8px] bg-black/30 p-3 text-[12px] text-error-900 font-mono overflow-auto flex-1 min-h-0">
											{`Error: ${result.error}`}
										</pre>
									);
								}
							return (
								<HighlightedJson className="rounded-[8px] bg-black/30 p-3 text-[12px] font-mono overflow-auto flex-1 min-h-0">
									{JSON.stringify(result.schema, null, 2)}
								</HighlightedJson>
							);
							})()}
						</div>
					</div>
					<div className="mt-4">
						<div className="rounded-lg border border-white/10 bg-white/5 p-4">
							<div className="text-[11px] text-text/40 mb-2">
								Sample JSON from Schema
							</div>
						{(() => {
							const sampleJson = generateSampleJson(code, SAMPLE_VARIABLES);
							const isError = sampleJson.startsWith("Error:");
							return isError ? (
								<pre className="rounded-[8px] bg-black/30 p-3 text-[12px] font-mono overflow-auto max-h-[300px] text-error-900">
									{sampleJson}
								</pre>
							) : (
								<HighlightedJson className="rounded-[8px] bg-black/30 p-3 text-[12px] font-mono overflow-auto max-h-[300px]">
									{sampleJson}
								</HighlightedJson>
							);
						})()}
						</div>
					</div>
				</DialogBody>
			</DialogContent>
		</Dialog>
	);
}

type DialogState =
	| { type: "closed" }
	| { type: "text-generation" }
	| { type: "end-node" };

export function StructuredOutputPlayground() {
	const [dialogState, setDialogState] = useState<DialogState>({
		type: "closed",
	});

	return (
		<div className="p-6">
			<h1 className="text-[20px] font-semibold text-inverse mb-4">
				Structured Output Playground
			</h1>
			<p className="text-[14px] text-text-muted mb-6">
				Test structured output dialogs for Text Generation Node and End Node.
			</p>
			<div className="flex gap-4">
				<button
					type="button"
					onClick={() => setDialogState({ type: "text-generation" })}
					className="rounded-md border border-white/20 bg-white/5 px-4 py-2 text-[14px] font-medium text-inverse/80 hover:text-inverse hover:bg-white/10 transition-colors"
				>
					Text Generate Node
				</button>
				<button
					type="button"
					onClick={() => setDialogState({ type: "end-node" })}
					className="rounded-md border border-white/20 bg-white/5 px-4 py-2 text-[14px] font-medium text-inverse/80 hover:text-inverse hover:bg-white/10 transition-colors"
				>
					End Node
				</button>
			</div>

			<StructuredOutputDialog
				isOpen={dialogState.type === "text-generation"}
				onOpenChange={(open) => {
					if (!open) setDialogState({ type: "closed" });
				}}
				title="Text Generation Node — Structured Output"
				description="Define a JSON Schema for the text generation output. @ references are not available in Text Generation Node."
			/>

			<StructuredOutputDialog
				isOpen={dialogState.type === "end-node"}
				onOpenChange={(open) => {
					if (!open) setDialogState({ type: "closed" });
				}}
				title="End Node — Structured Output"
				description="Define a JSON Schema for the end node output. Variables can be referenced with @."
			/>
		</div>
	);
}
