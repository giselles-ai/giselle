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
import { useToasts } from "@giselle-internal/ui/toast";
import { DescriptionEditor } from "@giselles-ai/text-editor/react-internal";
import { Popover as PopoverPrimitive } from "radix-ui";
import { type ReactNode, useCallback, useRef, useState } from "react";
import { useGiselle } from "../../../app-designer/store/giselle-client-provider";
import { HighlightedJson } from "../../../ui/highlighted-json";

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
				type: "text" as const,
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
 * Replace {{var}} placeholders to make the text parseable as valid JSON.
 * - Property position (standalone): {{var}} → "__MERGE_N__": "__PLACEHOLDER_N__"
 * - Value position (after ":"): {{var}} → "__VREF_N__"
 */
function replaceVariablesForParsing(text: string): {
	safeJson: string;
	variableNames: string[];
	variableTypes: ("merge" | "vref")[];
} {
	const variableNames: string[] = [];
	const variableTypes: ("merge" | "vref")[] = [];
	const safeJson = text.replace(
		/:\s*\{\{([^}]+)\}\}|\{\{([^}]+)\}\}/g,
		(_match, valueKey: string | undefined, mergeKey: string | undefined) => {
			const index = variableNames.length;
			if (valueKey !== undefined) {
				variableNames.push(valueKey);
				variableTypes.push("vref");
				return `: "__VREF_${index}__"`;
			}
			variableNames.push(mergeKey as string);
			variableTypes.push("merge");
			return `"__MERGE_${index}__": "__PLACEHOLDER_${index}__"`;
		},
	);
	return { safeJson, variableNames, variableTypes };
}

/**
 * Reverse the preprocess: restore placeholders back to {{var}}.
 */
function restoreVariables(
	text: string,
	variableNames: string[],
	variableTypes: ("merge" | "vref")[],
): string {
	let result = text;
	for (let i = 0; i < variableNames.length; i++) {
		if (variableTypes[i] === "vref") {
			result = result.replace(`"__VREF_${i}__"`, `{{${variableNames[i]}}}`);
		} else {
			result = result.replace(
				`"__MERGE_${i}__": "__PLACEHOLDER_${i}__"`,
				`{{${variableNames[i]}}}`,
			);
		}
	}
	return result;
}

type MergeResult =
	| { ok: true; schema: Record<string, unknown> }
	| { ok: false; error: string };

function resolveValue(
	value: unknown,
	variableNames: string[],
	variables: Record<string, string>,
): { resolved: unknown; error?: string } {
	if (typeof value === "string") {
		const vrefMatch = value.match(/^__VREF_(\d+)__$/);
		if (vrefMatch) {
			const index = Number(vrefMatch[1]);
			const variableName = variableNames[index];
			const variableValue = variables[variableName];
			if (variableValue == null) {
				return {
					resolved: value,
					error: `Variable "${variableName}" is not defined`,
				};
			}
			try {
				return { resolved: JSON.parse(variableValue) };
			} catch {
				return {
					resolved: value,
					error: `Variable "${variableName}" is not valid JSON`,
				};
			}
		}
	}
	return { resolved: value };
}

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

			const { resolved, error } = resolveValue(value, variableNames, variables);
			if (error) {
				return { ok: false, error };
			}

			if (
				typeof resolved === "object" &&
				resolved !== null &&
				!Array.isArray(resolved)
			) {
				const recursed = processSchemaNode(
					resolved as Record<string, unknown>,
					variableNames,
					variables,
				);
				if (!recursed.ok) return recursed;
				mergedProperties[key] = recursed.schema;
			} else {
				mergedProperties[key] = resolved;
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

function generateSampleJson(
	text: string,
	variables: Record<string, string>,
): string {
	const result = mergeReferencedSchemas(text, variables);
	if (!result.ok) return `Error: ${result.error}`;
	const sample = generateSampleFromSchema(result.schema);
	return JSON.stringify(sample, null, 2);
}

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

const DEFAULT_SCHEMA = `{
  "type": "object",
  "properties": {
    "example": { "type": "string" }
  },
  "required": ["example"]
}`;

const EMPTY_SUGGESTIONS: Suggestion[] = [];
const EMPTY_VARIABLES: Record<string, string> = {};

type StructuredOutputDialogProps = {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: ReactNode;
	initialSchema?: string;
	onSave?: (schema: string) => void;
	suggestions?: Suggestion[];
	variables?: Record<string, string>;
	showPreview?: boolean;
};

export function StructuredOutputDialog({
	isOpen,
	onOpenChange,
	title,
	description,
	initialSchema = DEFAULT_SCHEMA,
	onSave,
	suggestions = EMPTY_SUGGESTIONS,
	variables = EMPTY_VARIABLES,
	showPreview = true,
}: StructuredOutputDialogProps) {
	const client = useGiselle();
	const toasts = useToasts();
	const [code, setCode] = useState(initialSchema);
	const [schemaDescription, setSchemaDescription] = useState("");
	const [isGeneratingSchema, setIsGeneratingSchema] = useState(false);
	const [isGeneratePopoverOpen, setIsGeneratePopoverOpen] = useState(false);
	const viewRef = useRef<EditorView | null>(null);
	const initialSchemaRef = useRef(initialSchema);

	const handleChange = useCallback((value: string) => {
		setCode(value);
	}, []);

	const formatEditor = useCallback((view: EditorView) => {
		try {
			const raw = view.state.doc.toString();
			const { safeJson, variableNames, variableTypes } =
				replaceVariablesForParsing(raw);

			const parsed = JSON.parse(safeJson);
			const formatted = restoreVariables(
				JSON.stringify(parsed, null, 2),
				variableNames,
				variableTypes,
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

			const extensions = [
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
				jsonLinter,
				lintStyle,
				darkTheme,
				placeholder("Type JSON Schema here..."),
				updateListener,
			];

			if (suggestions.length > 0) {
				extensions.push(
					autocompletion({
						override: [createCompletionSource(suggestions)],
					}),
					mentionPlugin,
					mentionAtomicRanges,
					mentionChipStyle,
				);
			}

			const view = new EditorView({
				state: EditorState.create({
					doc: initialSchemaRef.current,
					extensions,
				}),
				parent: node,
			});
			viewRef.current = view;
		},
		[handleChange, formatEditor, suggestions],
	);

	const handleFormat = useCallback(() => {
		if (viewRef.current) {
			formatEditor(viewRef.current);
		}
	}, [formatEditor]);

	const handleSave = useCallback(() => {
		onSave?.(code);
		onOpenChange(false);
	}, [code, onSave, onOpenChange]);

	const handleGenerateSchema = useCallback(async () => {
		const description = schemaDescription.trim();
		if (description.length === 0) {
			toasts.error("Please describe the schema to generate.");
			return;
		}

		setIsGeneratingSchema(true);
		try {
			const { schema } = await client.generateJsonSchema({ description });
			const view = viewRef.current;
			if (!view) return;

			view.dispatch({
				changes: {
					from: 0,
					to: view.state.doc.length,
					insert: schema,
				},
				selection: { anchor: 0 },
			});
			setIsGeneratePopoverOpen(false);
			setSchemaDescription("");
		} catch (error) {
			console.error("Failed to generate schema", error);
			toasts.error("Failed to generate schema with AI.");
		} finally {
			setIsGeneratingSchema(false);
		}
	}, [client, schemaDescription, toasts]);

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
												insert: initialSchemaRef.current,
											},
											selection: { anchor: 0 },
										});
									}}
									className="rounded-md border border-error-900/40 px-4 py-1.5 text-[14px] font-medium text-error-900 hover:text-error-200 hover:bg-error-900/10 transition-colors"
								>
									Reset
								</button>
								<div className="flex items-center gap-2">
									<button
										type="button"
										onClick={handleFormat}
										className="rounded-md border border-white/20 px-4 py-1.5 text-[14px] font-medium text-inverse/80 hover:text-inverse hover:bg-white/10 transition-colors"
									>
										Format
										<kbd className="ml-2 text-[15px] text-inverse/40">
											&#x2318; S
										</kbd>
									</button>
									<PopoverPrimitive.Root
										open={isGeneratePopoverOpen}
										onOpenChange={setIsGeneratePopoverOpen}
									>
										<PopoverPrimitive.Trigger asChild>
											<button
												type="button"
												disabled={isGeneratingSchema}
												className="rounded-md border border-primary-900/40 px-4 py-1.5 text-[14px] font-medium text-primary-100 hover:text-primary-50 hover:bg-primary-900/20 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
											>
												{isGeneratingSchema
													? "Generating..."
													: "Generate With AI"}
											</button>
										</PopoverPrimitive.Trigger>
										<PopoverPrimitive.Portal>
											<PopoverPrimitive.Content
												side="bottom"
												align="end"
												sideOffset={8}
												onOpenAutoFocus={(e) => e.preventDefault()}
												className="z-[100] w-[560px] rounded-lg border border-white/15 bg-[#1a1a2e] p-4 shadow-xl"
											>
												<p className="mb-2 text-[12px] text-text/60">
													Describe the schema you want to generate.
													{suggestions.length > 0 && (
														<>
															{" "}
															Use <strong className="text-text/80">@</strong> to
															reference upstream node schemas.
														</>
													)}
												</p>
												<DescriptionEditor
													onValueChange={setSchemaDescription}
													onSubmit={
														isGeneratingSchema
															? undefined
															: handleGenerateSchema
													}
													placeholder="e.g. Extract title and summary from blog posts"
													className="w-full min-h-[200px] rounded-md border border-white/15 bg-black/30 px-3 py-2 text-[13px] text-inverse/80 focus:outline-none focus:border-white/25"
													autoFocus
													suggestions={suggestions}
												/>
												<button
													type="button"
													onClick={handleGenerateSchema}
													disabled={
														isGeneratingSchema ||
														schemaDescription.trim().length === 0
													}
													className="w-full rounded-md bg-primary-900 px-4 py-2 text-[13px] font-medium text-inverse hover:bg-primary-800 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
												>
													{isGeneratingSchema ? "Generating..." : "Generate"}
													<kbd className="ml-2 text-[11px] text-inverse/40">
														&#x2318; &#x23CE;
													</kbd>
												</button>
											</PopoverPrimitive.Content>
										</PopoverPrimitive.Portal>
									</PopoverPrimitive.Root>
								</div>
							</div>
							<div ref={editorContainerRef} className="flex-1 min-h-0" />
						</div>
						<div className="rounded-lg border border-white/10 bg-white/5 p-4 flex flex-col">
							<div className="flex items-center mb-2 min-h-[34px]">
								<span className="text-[11px] text-text/40">
									Sample JSON from Schema
								</span>
							</div>
							{(() => {
								const sampleJson = generateSampleJson(code, variables);
								const isError = sampleJson.startsWith("Error:");
								return isError ? (
									<pre className="rounded-[8px] bg-black/30 p-3 text-[12px] font-mono overflow-auto flex-1 min-h-0 text-error-900">
										{sampleJson}
									</pre>
								) : (
									<HighlightedJson className="rounded-[8px] bg-black/30 p-3 text-[12px] font-mono overflow-auto flex-1 min-h-0">
										{sampleJson}
									</HighlightedJson>
								);
							})()}
						</div>
					</div>
					{showPreview && (
						<div className="mt-4">
							<div className="rounded-lg border border-white/10 bg-white/5 p-4">
								<div className="text-[11px] text-text/40 mb-2">
									{Object.keys(variables).length > 0
										? "Variables Resolved JSON Schema"
										: "Parsed Schema"}
								</div>
								{(() => {
									const result = mergeReferencedSchemas(code, variables);
									if (!result.ok) {
										return (
											<pre className="rounded-[8px] bg-black/30 p-3 text-[12px] text-error-900 font-mono overflow-auto max-h-[300px]">
												{`Error: ${result.error}`}
											</pre>
										);
									}
									return (
										<HighlightedJson className="rounded-[8px] bg-black/30 p-3 text-[12px] font-mono overflow-auto max-h-[300px]">
											{JSON.stringify(result.schema, null, 2)}
										</HighlightedJson>
									);
								})()}
							</div>
						</div>
					)}
					{onSave && (
						<div className="mt-4 flex justify-end">
							<button
								type="button"
								onClick={handleSave}
								className="rounded-md bg-primary-900 px-6 py-2 text-[14px] font-medium text-inverse hover:bg-primary-800 transition-colors"
							>
								Save
							</button>
						</div>
					)}
				</DialogBody>
			</DialogContent>
		</Dialog>
	);
}
