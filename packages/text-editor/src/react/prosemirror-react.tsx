import React, { useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { ProseMirrorEditor } from "@giselle-sdk/text-editor-utils";
import type { Node } from "@giselle-sdk/data-type";
import { createSourceNodeView } from "./source-extension-prosemirror";

export interface ProseMirrorReactProps {
	value?: string;
	onValueChange?: (value: string) => void;
	nodes?: Node[];
	editable?: boolean;
	placeholder?: string;
	className?: string;
}

export interface ProseMirrorReactRef {
	editor: ProseMirrorEditor | null;
	focus: () => void;
	getJSON: () => any;
	setContent: (content: any) => void;
}

export const ProseMirrorReact = forwardRef<ProseMirrorReactRef, ProseMirrorReactProps>(
	({ value, onValueChange, nodes, editable = true, placeholder, className }, ref) => {
		const editorRef = useRef<HTMLDivElement>(null);
		const editorInstanceRef = useRef<ProseMirrorEditor | null>(null);
		const isUpdatingRef = useRef(false);

		useImperativeHandle(ref, () => ({
			editor: editorInstanceRef.current,
			focus: () => {
				editorInstanceRef.current?.focus();
			},
			getJSON: () => {
				return editorInstanceRef.current?.getJSON();
			},
			setContent: (content: any) => {
				editorInstanceRef.current?.setContent(content);
			},
		}));

		// Initialize editor
		useEffect(() => {
			if (!editorRef.current) return;

			const nodeViews: { [name: string]: any } = {};
			if (nodes) {
				nodeViews.Source = createSourceNodeView;
			}

			const editor = new ProseMirrorEditor({
				content: value ? JSON.parse(value) : undefined,
				onUpdate: (content) => {
					if (!isUpdatingRef.current && onValueChange) {
						onValueChange(JSON.stringify(content));
					}
				},
				editable,
				nodes,
				nodeViews,
			});

			const state = editor.createState();
			editor.createView(editorRef.current, state);

			editorInstanceRef.current = editor;

			return () => {
				editor.destroy();
				editorInstanceRef.current = null;
			};
		}, []);

		// Update content when value prop changes
		useEffect(() => {
			if (!editorInstanceRef.current || !value) return;

			const currentContent = JSON.stringify(editorInstanceRef.current.getJSON());
			if (currentContent !== value) {
				isUpdatingRef.current = true;
				try {
					const content = JSON.parse(value);
					editorInstanceRef.current.setContent(content);
				} catch (error) {
					console.error("Failed to parse editor content:", error);
				} finally {
					isUpdatingRef.current = false;
				}
			}
		}, [value]);

		// Update nodes when they change
		useEffect(() => {
			if (!editorInstanceRef.current || !nodes) return;
			editorInstanceRef.current.updateNodes(nodes);
		}, [nodes]);

		// Update editable state
		useEffect(() => {
			if (!editorInstanceRef.current?.view) return;

			// ProseMirror doesn't have a direct way to update editable state,
			// so we need to recreate the view or handle it in the editor options
			// For now, we'll handle this in the editor class if needed
		}, [editable]);

		return (
			<div
				ref={editorRef}
				className={className}
				data-placeholder={placeholder}
				style={{ minHeight: "2em" }}
			/>
		);
	}
);

ProseMirrorReact.displayName = "ProseMirrorReact";