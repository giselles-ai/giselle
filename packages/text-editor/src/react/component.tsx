import type { Node } from "@giselle-sdk/data-type";
import { ProseMirrorEditor } from "@giselle-sdk/text-editor-utils";
import clsx from "clsx/lite";
import {
	BoldIcon,
	ItalicIcon,
	List,
	ListOrdered,
	StrikethroughIcon,
} from "lucide-react";
import { Toolbar as ToolbarPrimitive } from "radix-ui";
import { type ReactNode, useRef, useState, useEffect } from "react";
import { ProseMirrorReact, type ProseMirrorReactRef } from "./prosemirror-react";

interface ToolbarProps {
	editor: ProseMirrorEditor | null;
	tools?: (editor: ProseMirrorEditor) => ReactNode;
}

function Toolbar({ editor, tools }: ToolbarProps) {
	const [activeStates, setActiveStates] = useState({
		bold: false,
		italic: false,
		strike: false,
		bulletList: false,
		orderedList: false,
	});

	const [canStates, setCanStates] = useState({
		bold: false,
		italic: false,
		strike: false,
		bulletList: false,
		orderedList: false,
	});

	useEffect(() => {
		if (!editor?.view) return;

		const updateStates = () => {
			setActiveStates({
				bold: editor.isActive("strong"),
				italic: editor.isActive("em"),
				strike: editor.isActive("strike"),
				bulletList: editor.isActive("bullet_list"),
				orderedList: editor.isActive("ordered_list"),
			});

			setCanStates({
				bold: editor.can().toggleBold(),
				italic: editor.can().toggleItalic(),
				strike: editor.can().toggleStrike(),
				bulletList: editor.can().toggleBulletList(),
				orderedList: editor.can().toggleOrderedList(),
			});
		};

		updateStates();

		// Listen to editor updates
		const view = editor.view;
		const originalDispatch = view.dispatch;
		view.dispatch = (tr: any) => {
			originalDispatch.call(view, tr);
			updateStates();
		};

		return () => {
			view.dispatch = originalDispatch;
		};
	}, [editor]);

	if (!editor) {
		return null;
	}

	return (
		<ToolbarPrimitive.Root
			className={clsx(
				"flex w-full min-w-max rounded-[4px] mb-[4px] items-center",
				"**:data-toolbar-item:w-[28px] **:data-toolbar-item:h-[30px] **:data-toolbar-item:flex **:data-toolbar-item:items-center **:data-toolbar-item:justify-center **:data-toolbar-item:data-[state=on]:bg-black-300/30 **:data-toolbar-item:rounded-[4px] **:data-toolbar-item:data-[state=on]:text-white-900",
				"**:data-toolbar-separator:w-[1px] **:data-toolbar-separator:h-[18px] **:data-toolbar-separator:bg-white-800 **:data-toolbar-separator:mx-[4px]",
			)}
			aria-label="Formatting options"
		>
			<ToolbarPrimitive.ToggleGroup
				type="multiple"
				aria-label="Text formatting"
				className="flex items-center gap-[4px]"
				value={[
					activeStates.bold ? "bold" : null,
					activeStates.italic ? "italic" : null,
					activeStates.strike ? "strike" : null,
				].filter((item) => item !== null)}
			>
				<ToolbarPrimitive.ToggleItem
					value="bold"
					aria-label="Bold"
					data-toolbar-item
					onClick={() => editor.chain().focus().toggleBold().run()}
					disabled={!canStates.bold}
				>
					<BoldIcon className="w-[12px]" />
				</ToolbarPrimitive.ToggleItem>
				<ToolbarPrimitive.ToggleItem
					value="italic"
					aria-label="Italic"
					data-toolbar-item
					onClick={() => editor.chain().focus().toggleItalic().run()}
					disabled={!canStates.italic}
				>
					<ItalicIcon className="w-[12px]" />
				</ToolbarPrimitive.ToggleItem>
				<ToolbarPrimitive.ToggleItem
					value="strike"
					aria-label="Strike"
					data-toolbar-item
					onClick={() => editor.chain().focus().toggleStrike().run()}
					disabled={!canStates.strike}
				>
					<StrikethroughIcon className="w-[12px]" />
				</ToolbarPrimitive.ToggleItem>
			</ToolbarPrimitive.ToggleGroup>
			<ToolbarPrimitive.Separator data-toolbar-separator />
			<ToolbarPrimitive.ToggleGroup
				type="single"
				aria-label="Text formatting"
				className="flex items-center gap-[4px]"
				value={
					activeStates.bulletList
						? "bulletList"
						: activeStates.orderedList
							? "orderedList"
							: ""
				}
			>
				<ToolbarPrimitive.ToggleItem
					value="orderedList"
					aria-label="Ordered list"
					data-toolbar-item
					onClick={() => {
						if (activeStates.bulletList) {
							editor.chain().focus().toggleBulletList().run();
						}
						editor.chain().focus().toggleOrderedList().run();
					}}
					disabled={!canStates.orderedList}
				>
					<ListOrdered className="w-[18px]" />
				</ToolbarPrimitive.ToggleItem>

				<ToolbarPrimitive.ToggleItem
					value="bulletList"
					aria-label="Bulleted list"
					data-toolbar-item
					onClick={() => {
						if (activeStates.orderedList) {
							editor.chain().focus().toggleOrderedList().run();
						}
						editor.chain().focus().toggleBulletList().run();
					}}
					disabled={!canStates.bulletList}
				>
					<List className="w-[18px]" />
				</ToolbarPrimitive.ToggleItem>
			</ToolbarPrimitive.ToggleGroup>
			{tools && (
				<>
					<ToolbarPrimitive.Separator data-toolbar-separator />
					{tools(editor)}
				</>
			)}
		</ToolbarPrimitive.Root>
	);
}

export interface TextEditorProps {
	value?: string;
	onValueChange?: (value: string) => void;
	tools?: (editor: ProseMirrorEditor) => ReactNode;
	nodes?: Node[];
}

export function TextEditor({
	value,
	onValueChange,
	tools,
	nodes,
}: TextEditorProps) {
	const editorRef = useRef<ProseMirrorReactRef>(null);
	const [editor, setEditor] = useState<ProseMirrorEditor | null>(null);

	useEffect(() => {
		if (editorRef.current?.editor) {
			setEditor(editorRef.current.editor);
		}
	}, [editorRef.current?.editor]);

	return (
		<div className="flex flex-col h-full w-full">
			<Toolbar editor={editor} tools={tools} />
			<div className="flex-1 overflow-hidden">
				<ProseMirrorReact
					ref={editorRef}
					value={value}
					onValueChange={onValueChange}
					nodes={nodes}
					className="prompt-editor border-[0.5px] border-white-900 rounded-[8px] p-[16px] h-full overflow-y-auto"
				/>
			</div>
		</div>
	);
}