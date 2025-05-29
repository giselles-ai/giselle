import { baseKeymap } from "prosemirror-commands";
import { dropCursor } from "prosemirror-dropcursor";
import { gapCursor } from "prosemirror-gapcursor";
import { history, redo, undo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import {
	DOMParser,
	DOMSerializer,
	Node,
	Node as PMNode,
	type Schema,
} from "prosemirror-model";
import { EditorState, type Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { buildInputRules } from "./input-rules";
import { toggleList } from "./list-commands";
import { createPlugins } from "./plugins";
import { createSchema } from "./schema";
import {
	createSourceExtensionPlugin,
	updateSourceExtensionNodes,
} from "./source-extension";

export interface EditorOptions {
	content?: any;
	onUpdate?: (content: any) => void;
	editable?: boolean;
	nodes?: any[];
	nodeViews?: {
		[name: string]: (
			node: PMNode,
			view: EditorView,
			getPos: () => number | undefined,
		) => any;
	};
}

export class ProseMirrorEditor {
	public view: EditorView | null = null;
	public schema: Schema;
	private options: EditorOptions;

	constructor(options: EditorOptions = {}) {
		this.options = options;
		this.schema = createSchema(options.nodes ? { includeSource: true } : {});
	}

	public createState(content?: any): EditorState {
		const doc = content
			? this.parseContent(content)
			: this.schema.node("doc", null, [this.schema.node("paragraph")]);

		return EditorState.create({
			doc,
			plugins: this.createPlugins(),
		});
	}

	public createView(element: HTMLElement, state?: EditorState): EditorView {
		const editorState = state || this.createState(this.options.content);

		this.view = new EditorView(element, {
			state: editorState,
			dispatchTransaction: (transaction: Transaction) => {
				const newState = this.view!.state.apply(transaction);
				this.view!.updateState(newState);

				if (transaction.docChanged && this.options.onUpdate) {
					this.options.onUpdate(this.getJSON());
				}
			},
			editable: () => this.options.editable !== false,
			nodeViews: this.options.nodeViews || {},
		});

		return this.view;
	}

	public getJSON(): any {
		if (!this.view) return null;
		return this.view.state.doc.toJSON();
	}

	public setContent(content: any): void {
		if (!this.view) return;

		const doc = this.parseContent(content);
		const newState = EditorState.create({
			doc,
			plugins: this.view.state.plugins,
		});

		this.view.updateState(newState);
	}

	public focus(): void {
		if (this.view) {
			this.view.focus();
		}
	}

	public destroy(): void {
		if (this.view) {
			this.view.destroy();
			this.view = null;
		}
	}

	public can(): {
		toggleBold: () => boolean;
		toggleItalic: () => boolean;
		toggleStrike: () => boolean;
		toggleBulletList: () => boolean;
		toggleOrderedList: () => boolean;
	} {
		return {
			toggleBold: () => this.canToggleMark("strong"),
			toggleItalic: () => this.canToggleMark("em"),
			toggleStrike: () => this.canToggleMark("strike"),
			toggleBulletList: () => this.canToggleList("bullet_list"),
			toggleOrderedList: () => this.canToggleList("ordered_list"),
		};
	}

	public chain(): {
		focus: () => any;
		toggleBold: () => any;
		toggleItalic: () => any;
		toggleStrike: () => any;
		toggleBulletList: () => any;
		toggleOrderedList: () => any;
		run: () => boolean;
	} {
		if (!this.view) {
			return {
				focus: () => this.chain(),
				toggleBold: () => this.chain(),
				toggleItalic: () => this.chain(),
				toggleStrike: () => this.chain(),
				toggleBulletList: () => this.chain(),
				toggleOrderedList: () => this.chain(),
				run: () => false,
			};
		}

		let transaction = this.view.state.tr;
		let focused = false;

		const chainMethods = {
			focus: () => {
				if (!focused) {
					this.focus();
					focused = true;
				}
				return chainMethods;
			},
			toggleBold: () => {
				transaction = this.toggleMark("strong", transaction) || transaction;
				return chainMethods;
			},
			toggleItalic: () => {
				transaction = this.toggleMark("em", transaction) || transaction;
				return chainMethods;
			},
			toggleStrike: () => {
				transaction = this.toggleMark("strike", transaction) || transaction;
				return chainMethods;
			},
			toggleBulletList: () => {
				this.executeListToggle("bullet_list");
				return chainMethods;
			},
			toggleOrderedList: () => {
				this.executeListToggle("ordered_list");
				return chainMethods;
			},
			run: () => {
				if (this.view && transaction && transaction.steps.length > 0) {
					this.view.dispatch(transaction);
					return true;
				}
				return false;
			},
		};

		return chainMethods;
	}

	public isActive(name: string): boolean {
		if (!this.view) return false;

		const { state } = this.view;
		const { selection } = state;

		// Check for marks
		if (this.schema.marks[name]) {
			return state.doc.rangeHasMark(
				selection.from,
				selection.to,
				this.schema.marks[name],
			);
		}

		// Check for nodes
		if (this.schema.nodes[name]) {
			return this.isNodeActive(name);
		}

		return false;
	}

	private parseContent(content: any): PMNode {
		if (!content) {
			return this.schema.node("doc", null, [this.schema.node("paragraph")]);
		}

		if (typeof content === "string") {
			try {
				content = JSON.parse(content);
			} catch {
				// If it's not JSON, treat as plain text
				return this.schema.node("doc", null, [
					this.schema.node("paragraph", null, [this.schema.text(content)]),
				]);
			}
		}

		return PMNode.fromJSON(this.schema, content);
	}

	private createPlugins() {
		const plugins = createPlugins(this.schema);

		// Add Source extension plugin if nodes are provided
		if (this.options.nodes) {
			plugins.push(createSourceExtensionPlugin({ nodes: this.options.nodes }));
		}

		return plugins;
	}

	private canToggleMark(markName: string): boolean {
		if (!this.view) return false;
		const markType = this.schema.marks[markName];
		if (!markType) return false;

		const { state } = this.view;
		return state.selection.empty
			? true
			: state.doc.rangeHasMark(
					state.selection.from,
					state.selection.to,
					markType,
				);
	}

	private canToggleList(listName: string): boolean {
		if (!this.view) return false;

		const listType = this.schema.nodes[listName];
		const itemType = this.schema.nodes.list_item;

		if (!listType || !itemType) return false;

		const { state } = this.view;
		return toggleList(listType, itemType)(state, null);
	}

	private toggleMark(
		markName: string,
		tr?: Transaction,
	): Transaction | undefined {
		if (!this.view) return tr;

		const markType = this.schema.marks[markName];
		if (!markType) return tr;

		const { state } = this.view;
		const transaction = tr || state.tr;
		const { selection } = state;

		if (selection.empty) {
			const storedMarks = transaction.storedMarks || selection.$from.marks();
			if (markType.isInSet(storedMarks)) {
				transaction.removeStoredMark(markType);
			} else {
				transaction.addStoredMark(markType.create());
			}
		} else {
			if (state.doc.rangeHasMark(selection.from, selection.to, markType)) {
				transaction.removeMark(selection.from, selection.to, markType);
			} else {
				transaction.addMark(selection.from, selection.to, markType.create());
			}
		}

		return transaction;
	}

	private executeListToggle(listName: string): void {
		if (!this.view) return;

		const listType = this.schema.nodes[listName];
		const itemType = this.schema.nodes.list_item;

		if (!listType || !itemType) return;

		const command = toggleList(listType, itemType);
		command(this.view.state, this.view.dispatch);
	}

	private isNodeActive(nodeName: string): boolean {
		if (!this.view) return false;

		const { state } = this.view;
		const { selection } = state;
		const { $from } = selection;

		for (let i = $from.depth; i > 0; i--) {
			if ($from.node(i).type.name === nodeName) {
				return true;
			}
		}

		return false;
	}

	public updateNodes(nodes: any[]): void {
		if (this.view && this.options.nodes) {
			this.options.nodes = nodes;
			updateSourceExtensionNodes(this.view, nodes);
		}
	}

	public insertSourceNode(node: any, outputId: string): boolean {
		if (!this.view || !this.schema.nodes.Source) return false;

		const { state } = this.view;
		const { selection } = state;

		const sourceNode = this.schema.nodes.Source.create({ node, outputId });
		const tr = state.tr.replaceSelectionWith(sourceNode);

		this.view.dispatch(tr);
		return true;
	}
}
