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
import { EmptyState } from "@giselle-internal/ui/empty-state";
import { PageHeading } from "@giselle-internal/ui/page-heading";
import { Pencil, Plus, Trash } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { GlassButton } from "@/components/ui/glass-button";
import type { TeamPlan } from "@/db/schema";
import { GlassCard } from "../vector-stores/ui/glass-card";
import { RepoActionMenu } from "../vector-stores/ui/repo-action-menu";
import { SectionHeader } from "../vector-stores/ui/section-header";
import { DataStoreCreateDialog } from "./data-store-create-dialog";
import { DataStoreDeleteDialog } from "./data-store-delete-dialog";
import { DataStoreEditDialog } from "./data-store-edit-dialog";
import type { DataStoreListItem } from "./types";

type DataStoresPageClientProps = {
	dataStores: DataStoreListItem[];
	hasAccess: boolean;
	maxStores: number;
	teamPlan: TeamPlan;
	isCreateDisabled: boolean;
	createDisabledReason?: string;
};

type ModalState =
	| { type: "closed" }
	| { type: "creating"; key: number }
	| { type: "editing"; dataStore: DataStoreListItem }
	| { type: "deleting"; dataStore: DataStoreListItem };

export function DataStoresPageClient({
	dataStores,
	hasAccess,
	maxStores,
	teamPlan,
	isCreateDisabled,
	createDisabledReason,
}: DataStoresPageClientProps) {
	const [modalState, setModalState] = useState<ModalState>({ type: "closed" });
	const usageCount = dataStores.length;

	const handleCreateClick = () => {
		setModalState((prev) => ({
			type: "creating",
			key: prev.type === "creating" ? prev.key + 1 : 0,
		}));
	};

	const handleModalClose = () => {
		setModalState({ type: "closed" });
	};

	const handleEditClick = (dataStore: DataStoreListItem) => {
		setModalState({ type: "editing", dataStore });
	};

	const handleDeleteClick = (dataStore: DataStoreListItem) => {
		setModalState({ type: "deleting", dataStore });
	};

	return (
		<div className="flex flex-col gap-page-horizontal">
			<div className="flex justify-between items-center">
				<PageHeading as="h1" glow>
					Data Stores
				</PageHeading>
				<GlassButton
					type="button"
					onClick={handleCreateClick}
					disabled={isCreateDisabled}
					title={createDisabledReason}
				>
					<span className="grid place-items-center rounded-full size-4 bg-primary-200 opacity-50">
						<Plus className="size-3 text-link-muted" />
					</span>
					New Data Store
				</GlassButton>
			</div>

			<Card className="rounded-[8px] bg-transparent p-6 border-0">
				<SectionHeader
					title="PostgreSQL"
					description="Connect to PostgreSQL databases to query and interact with your data."
					className="mb-0"
				/>
				<div className="my-4">
					<DataStoreUsageNotice
						hasAccess={hasAccess}
						usageCount={usageCount}
						maxStores={maxStores}
						teamPlan={teamPlan}
					/>
				</div>

				{hasAccess ? (
					dataStores.length > 0 ? (
						<div className="space-y-4">
							{dataStores.map((dataStore) => (
								<DataStoreItem
									key={dataStore.id}
									dataStore={dataStore}
									onEdit={handleEditClick}
									onDelete={handleDeleteClick}
								/>
							))}
						</div>
					) : (
						<EmptyDataStoreCard />
					)
				) : (
					<DataStoreLockedCard />
				)}
			</Card>

			{modalState.type === "creating" && (
				<DataStoreCreateDialog
					key={modalState.key}
					isOpen={true}
					onOpenChange={(open) => {
						if (!open) handleModalClose();
					}}
					onSuccess={handleModalClose}
				/>
			)}

			{modalState.type === "editing" && (
				<DataStoreEditDialog
					isOpen={true}
					onOpenChange={(open) => {
						if (!open) handleModalClose();
					}}
					dataStore={modalState.dataStore}
					onSuccess={handleModalClose}
				/>
			)}

			{modalState.type === "deleting" && (
				<DataStoreDeleteDialog
					isOpen={true}
					onOpenChange={(open) => {
						if (!open) handleModalClose();
					}}
					dataStore={modalState.dataStore}
					onSuccess={handleModalClose}
				/>
			)}

			<CodeEditorPlayground />
		</div>
	);
}

function DataStoreUsageNotice({
	hasAccess,
	usageCount,
	maxStores,
	teamPlan,
}: {
	hasAccess: boolean;
	usageCount: number;
	maxStores: number;
	teamPlan: TeamPlan;
}) {
	if (!hasAccess) {
		return (
			<Alert
				variant="destructive"
				className="border-error-900/40 bg-error-900/10 text-error-900"
			>
				<AlertTitle className="text-[13px] font-semibold text-error-900">
					Data Stores are not included in the {getPlanLabel(teamPlan)} plan
				</AlertTitle>
				<AlertDescription className="text-[12px] text-error-900/80">
					Upgrade to{" "}
					<Link className="underline" href="/settings/team">
						Pro or Team
					</Link>{" "}
					to connect PostgreSQL databases with Data Stores.
				</AlertDescription>
			</Alert>
		);
	}

	const remaining = Math.max(maxStores - usageCount, 0);
	const isLimitReached = remaining === 0;

	return (
		<div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
			<div className="flex items-center justify-between text-[13px] text-text/70">
				<span>Data Stores used</span>
				<span className="font-semibold text-inverse">
					{usageCount} / {maxStores}
				</span>
			</div>
			<p className="mt-1 text-[12px] text-text/60">
				{isLimitReached
					? `You've used all Data Stores included in your ${getPlanLabel(teamPlan)} plan.`
					: `${remaining} Data ${remaining === 1 ? "Store" : "Stores"} remaining in your ${getPlanLabel(teamPlan)} plan.`}
			</p>
			{isLimitReached && (
				<Alert
					variant="destructive"
					className="mt-3 border-error-900/40 bg-error-900/10 text-error-900"
				>
					<AlertTitle className="text-[13px] font-semibold text-error-900">
						Maximum capacity reached
					</AlertTitle>
					<AlertDescription className="text-[12px] text-error-900/80">
						Delete an existing store or upgrade your plan in{" "}
						<Link className="underline" href="/settings/team">
							Team Settings
						</Link>{" "}
						to add more Data Stores.
					</AlertDescription>
				</Alert>
			)}
		</div>
	);
}

function DataStoreLockedCard() {
	return (
		<div className="text-center py-16 bg-surface rounded-lg border border-white/10">
			<h3 className="text-inverse text-lg font-medium">
				Data Stores are locked
			</h3>
			<p className="mt-2 text-text/60 text-sm max-w-xl mx-auto">
				Upgrade to the Pro or Team plan to connect PostgreSQL databases and use
				Data Stores in your agents.
			</p>
			<Link
				href="/settings/team"
				className="inline-flex mt-4 items-center justify-center rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-inverse/80 hover:text-inverse"
			>
				View plans
			</Link>
		</div>
	);
}

function EmptyDataStoreCard() {
	return (
		<div className="text-center py-16 bg-surface rounded-lg">
			<EmptyState
				title="No data stores yet."
				description={
					'Please create a data store using the "New Data Store" button.'
				}
			/>
		</div>
	);
}

const PLAN_LABELS: Record<TeamPlan, string> = {
	free: "Free",
	pro: "Pro",
	team: "Team",
	enterprise: "Enterprise",
	internal: "Internal",
};

function getPlanLabel(plan: TeamPlan) {
	return PLAN_LABELS[plan];
}

type DataStoreItemProps = {
	dataStore: DataStoreListItem;
	onEdit: (dataStore: DataStoreListItem) => void;
	onDelete: (dataStore: DataStoreListItem) => void;
};

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
 * Sample variable map: label → resolved value.
 * The editor stores `{{label}}` and the preview replaces it with the value.
 */
const SAMPLE_VARIABLES: Record<string, string> = {
	userName: "Alice",
	userAge: "30",
	userEmail: "alice@example.com",
	companyName: "Acme Inc.",
	"number property": '{ "type": "number", "minimum": 0 }',
	"object property":
		'{ "type": "object", "properties": { "id": { "type": "number" }, "label": { "type": "string" } } }',
};

const VARIABLE_SUGGESTIONS: Suggestion[] = [
	// Variable references (inserted as {{name}})
	...Object.keys(SAMPLE_VARIABLES).map((key) => ({
		label: key,
		apply: `{{${key}}}`,
	})),
	// Snippet references (inserted as {{name}}, resolved in preview)
	{ label: "number property", apply: "{{number property}}" },
	{ label: "object property", apply: "{{object property}}" },
];

function resolveVariables(
	text: string,
	variables: Record<string, string>,
): string {
	return text.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => {
		return variables[key] ?? `{{${key}}}`;
	});
}

/**
 * Resolve variables and format the result as pretty-printed JSON if possible.
 */
function formatResolved(
	text: string,
	variables: Record<string, string>,
): string {
	const resolved = resolveVariables(text, variables);
	try {
		const parsed = JSON.parse(resolved);
		return JSON.stringify(parsed, null, 2);
	} catch {
		return resolved;
	}
}

/**
 * Generate a sample JSON value from a JSON Schema.
 * Variables ({{key}}) are resolved using the provided map.
 */
function generateSampleFromSchema(
	schema: unknown,
	variables: Record<string, string>,
): unknown {
	if (schema == null || typeof schema !== "object") return null;

	const s = schema as Record<string, unknown>;

	// If "default" is present, use it
	if ("default" in s) {
		const def = s.default;
		if (typeof def === "string") return resolveVariables(def, variables);
		return def;
	}

	// If "enum" is present, use the first value
	if (Array.isArray(s.enum) && s.enum.length > 0) {
		const first = s.enum[0];
		if (typeof first === "string") return resolveVariables(first, variables);
		return first;
	}

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
					result[key] = generateSampleFromSchema(propSchema, variables);
				}
			}
			return result;
		}
		case "array": {
			const itemSample = s.items
				? generateSampleFromSchema(s.items, variables)
				: null;
			return [itemSample];
		}
		case "string":
			return "";
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
 * Parse the editor content (which may contain {{variables}}) as JSON Schema,
 * and generate a sample JSON preview string.
 */
function generatePreview(
	code: string,
	variables: Record<string, string>,
): string {
	try {
		// Replace {{...}} with JSON-safe strings for parsing
		const placeholders: Map<string, string> = new Map();
		const safeJson = code.replace(/\{\{([^}]+)\}\}/g, (match, key: string) => {
			const value = variables[key] ?? match;
			const placeholder = `__VAR_${placeholders.size}__`;
			placeholders.set(placeholder, value);
			return `"${placeholder}"`;
		});

		const schema = JSON.parse(safeJson);

		// Walk the parsed schema and replace placeholder strings with actual values
		const resolved = restorePlaceholders(schema, placeholders);

		return JSON.stringify(
			generateSampleFromSchema(resolved, variables),
			null,
			2,
		);
	} catch {
		return "(invalid schema)";
	}
}

function tryParseJson(text: string): unknown {
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}

function restorePlaceholders(
	value: unknown,
	placeholders: Map<string, string>,
): unknown {
	if (typeof value === "string") {
		const resolved = placeholders.get(value);
		if (resolved == null) return value;
		// If the resolved value is valid JSON (object/array), parse it
		return tryParseJson(resolved);
	}
	if (Array.isArray(value)) {
		return value.map((v) => restorePlaceholders(v, placeholders));
	}
	if (value != null && typeof value === "object") {
		const result: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(value)) {
			result[k] = restorePlaceholders(v, placeholders);
		}
		return result;
	}
	return value;
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

const SAMPLE_SCHEMA = `{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": {{userName}}
    },
    "age": {
      "type": "number",
      "minimum": 0
    }
  },
  "required": ["name", "age"]
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

function CodeEditorPlayground() {
	const [code, setCode] = useState(SAMPLE_SCHEMA);
	const editorRef = useRef<HTMLDivElement>(null);
	const viewRef = useRef<EditorView | null>(null);

	const handleChange = useCallback((value: string) => {
		setCode(value);
	}, []);

	useEffect(() => {
		if (!editorRef.current) return;

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
					]),
					json(),
					autocompletion({
						override: [createCompletionSource(VARIABLE_SUGGESTIONS)],
					}),
					mentionPlugin,
					mentionAtomicRanges,
					mentionChipStyle,
					darkTheme,
					placeholder("Type JSON here..."),
					updateListener,
				],
			}),
			parent: editorRef.current,
		});
		viewRef.current = view;

		return () => {
			view.destroy();
			viewRef.current = null;
		};
	}, [handleChange]);

	const handleFormat = useCallback(() => {
		const view = viewRef.current;
		if (!view) return;

		try {
			const raw = view.state.doc.toString();

			// Replace {{...}} with temporary JSON-safe placeholders
			const placeholders: string[] = [];
			const safeJson = raw.replace(/\{\{([^}]+)\}\}/g, (match) => {
				const index = placeholders.length;
				placeholders.push(match);
				return `"__PLACEHOLDER_${index}__"`;
			});

			const parsed = JSON.parse(safeJson);
			let formatted = JSON.stringify(parsed, null, 2);

			// Restore {{...}} from placeholders
			for (let i = 0; i < placeholders.length; i++) {
				formatted = formatted.replace(
					`"__PLACEHOLDER_${i}__"`,
					placeholders[i],
				);
			}

			view.dispatch({
				changes: {
					from: 0,
					to: view.state.doc.length,
					insert: formatted,
				},
			});
		} catch {
			// JSON が不正な場合は何もしない
		}
	}, []);

	return (
		<Card className="rounded-[8px] bg-transparent p-6 border-0">
			<SectionHeader
				title="Code Editor Playground"
				description="Testing CodeMirror 6 with JavaScript language support"
				className="mb-4"
			/>
			<div className="rounded-lg border border-white/10 bg-white/5 p-4">
				<div className="flex justify-end mb-2">
					<button
						type="button"
						onClick={handleFormat}
						className="rounded-md border border-white/20 px-3 py-1 text-[12px] font-medium text-inverse/80 hover:text-inverse hover:bg-white/10 transition-colors"
					>
						Format
					</button>
				</div>
				<div ref={editorRef} />
			</div>
			<div className="mt-4 text-[11px] text-text/40">
				Preview (variables resolved)
			</div>
			<pre className="mt-1 rounded-[8px] bg-black/30 p-3 text-[12px] text-text/60 font-mono overflow-auto">
				{formatResolved(code, SAMPLE_VARIABLES)}
			</pre>
		</Card>
	);
}

function DataStoreItem({ dataStore, onEdit, onDelete }: DataStoreItemProps) {
	return (
		<GlassCard className="group" paddingClassName="px-[24px] py-[16px]">
			<div className="flex items-start justify-between gap-4 mb-4">
				<div>
					<h5 className="text-inverse font-medium text-[16px] leading-[22.4px] font-sans">
						{dataStore.name}
					</h5>
					<div className="text-text-muted text-[13px] leading-[18px] font-geist mt-1">
						ID: {dataStore.id}
					</div>
				</div>
				<RepoActionMenu
					id={`data-store-actions-${dataStore.id}`}
					actions={[
						{
							value: "edit",
							label: "Edit",
							icon: <Pencil className="h-4 w-4" />,
							onSelect: () => onEdit(dataStore),
						},
						{
							value: "delete",
							label: "Delete",
							icon: <Trash className="h-4 w-4 text-error-900" />,
							destructive: true,
							onSelect: () => onDelete(dataStore),
						},
					]}
				/>
			</div>
		</GlassCard>
	);
}
