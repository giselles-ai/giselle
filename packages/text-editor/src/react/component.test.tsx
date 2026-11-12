// @vitest-environment jsdom
import {
	ConnectionId,
	InputId,
	NodeId,
	OutputId,
	TextNode,
} from "@giselles-ai/protocol";
import {
	createSourceExtensionJSONContent,
	extensions,
} from "@giselles-ai/text-editor-utils";
import { Editor as CoreEditor } from "@tiptap/core";
import type { Editor } from "@tiptap/react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { TextEditor } from "./component";
import { SourceExtensionReact } from "./source-extension-react";
import { createSuggestion } from "./suggestion";

async function update(callback: () => void) {
	await act(async () => {
		callback();
		await Promise.resolve();
	});
}

it("round trips connected Source clipboard HTML and rejects disconnected references", () => {
	const node = TextNode.parse({
		id: NodeId.generate(),
		type: "variable",
		name: "Input",
		content: { type: "text", text: "value" },
		inputs: [],
		outputs: [{ id: OutputId.generate(), label: "Text", accessor: "text" }],
	});
	const attrs = {
		node,
		outputId: node.outputs[0].id,
		path: ["nested", "answer"],
	};
	const original = new CoreEditor({
		extensions: [
			...extensions,
			SourceExtensionReact.configure({ nodes: [node] }),
		],
		content: {
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [createSourceExtensionJSONContent(attrs)],
				},
			],
		},
	});
	const html = original.getHTML();
	const restored = new CoreEditor({
		extensions: [
			...extensions,
			SourceExtensionReact.configure({ nodes: [node] }),
		],
		content: html,
	});
	const disconnected = new CoreEditor({
		extensions: [...extensions, SourceExtensionReact.configure({ nodes: [] })],
		content: html,
	});
	try {
		expect(restored.getJSON()).toEqual(original.getJSON());
		expect(disconnected.getJSON().content?.[0].content?.[0].type).toBe("text");
	} finally {
		original.destroy();
		restored.destroy();
		disconnected.destroy();
	}
});

it("preserves editing, toolbar state, Source insertion and undo/redo", async () => {
	vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
	const container = document.createElement("div");
	document.body.append(container);
	const root = createRoot(container);
	let editor: Editor | undefined;
	const onValueChange = vi.fn();
	const node = TextNode.parse({
		id: NodeId.generate(),
		type: "variable",
		name: "Input",
		content: { type: "text", text: "value" },
		inputs: [],
		outputs: [{ id: OutputId.generate(), label: "Text", accessor: "text" }],
	});
	const output = node.outputs[0];
	const connections = [
		{
			id: ConnectionId.generate(),
			outputNode: node,
			output,
			inputNode: node,
			input: { id: InputId.generate(), label: "Input", accessor: "input" },
		},
	];
	const suggestion = createSuggestion(connections);
	const initial = {
		type: "doc",
		content: [
			{ type: "paragraph", content: [{ type: "text", text: "Hello" }] },
		],
	};
	try {
		await update(() => {
			root.render(
				<TextEditor
					value={JSON.stringify(initial)}
					connections={connections}
					onValueChange={onValueChange}
					tools={(value) => {
						editor = value;
						return null;
					}}
				/>,
			);
		});
		if (!editor) throw new Error("Editor was not mounted");
		const instance = editor;
		expect(instance.getJSON()).toEqual(initial);
		expect(onValueChange).not.toHaveBeenCalled();
		await update(() => {
			instance.chain().setTextSelection({ from: 1, to: 6 }).toggleBold().run();
		});
		expect(
			container
				.querySelector('[aria-label="Bold"]')
				?.getAttribute("data-state"),
		).toBe("on");
		await update(() => {
			instance.commands.setTextSelection(1);
			instance.commands.unsetBold();
		});
		expect(
			container
				.querySelector('[aria-label="Bold"]')
				?.getAttribute("data-state"),
		).toBe("off");
		await update(() => {
			instance.commands.toggleBulletList();
		});
		expect(instance.getJSON().content?.[0].type).toBe("bulletList");
		await update(() => {
			instance.commands.toggleBulletList();
		});
		const beforeInsertion = instance.getJSON();
		expect(
			await suggestion.items?.({
				query: "Text",
				editor: instance,
				signal: new AbortController().signal,
			}),
		).toEqual([expect.objectContaining({ id: output.id })]);
		await update(() => {
			suggestion.command?.({
				editor: instance,
				range: { from: 1, to: 1 },
				props: {
					id: output.id,
					label: "Input / Text",
					node,
					output,
					path: ["answer"],
				},
			});
		});
		const inserted = instance.getJSON();
		expect(inserted.content).toHaveLength(1);
		expect(inserted.content?.[0].content?.[0]).toEqual(
			createSourceExtensionJSONContent({
				node: { id: node.id, type: node.type, content: node.content },
				outputId: output.id,
				path: ["answer"],
			}),
		);
		expect(inserted.content?.[0].content?.[1]).toMatchObject({
			type: "text",
			text: " ",
		});
		expect(instance.getHTML()).toContain('data-path="answer"');
		expect(container.textContent).toContain("Input / Text / answer");
		await update(() => {
			instance.commands.undo();
		});
		// History may group adjacent edits; redo must restore the exact saved document.
		expect(instance.getJSON()).not.toEqual(inserted);
		await update(() => {
			instance.commands.redo();
		});
		expect(instance.getJSON()).toEqual(inserted);
		expect(beforeInsertion).not.toEqual(inserted);
		expect(JSON.parse(onValueChange.mock.lastCall?.[0])).toEqual(inserted);
	} finally {
		await update(() => root.unmount());
		container.remove();
		vi.unstubAllGlobals();
	}
});
