import { defaultName } from "@giselles-ai/node-registry";
import type { NodeLike, Output } from "@giselles-ai/protocol";
import type { SuggestionProps } from "@tiptap/suggestion";
import clsx from "clsx/lite";
import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useState,
} from "react";

export interface SuggestionItem {
	id: string;
	node: NodeLike;
	output: Output;
	label: string;
}
interface SuggestionListProps extends SuggestionProps<SuggestionItem> {}
export interface SuggestionListRef {
	onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const SuggestionList = forwardRef<
	SuggestionListRef,
	SuggestionListProps
>(({ items, command }, ref) => {
	const [selectedIndex, setSelectedIndex] = useState(0);
	useEffect(() => {
		if (items.length >= 0) {
			setSelectedIndex(0);
		}
	}, [items.length]);
	const selectItem = useCallback(
		(index: number) => {
			const item = items[index];
			if (item) {
				command(item);
			}
		},
		[items, command],
	);

	useImperativeHandle(ref, () => ({
		onKeyDown: ({ event }) => {
			if (items.length === 0) {
				return false;
			}

			if (event.key === "ArrowUp") {
				setSelectedIndex((prev) => (prev + items.length - 1) % items.length);
				return true;
			}
			if (event.key === "ArrowDown") {
				setSelectedIndex((prev) => (prev + 1) % items.length);
				return true;
			}

			if (event.key === "Enter") {
				selectItem(selectedIndex);
				return true;
			}

			return false;
		},
	}));

	if (items.length === 0) {
		return null;
	}

	return (
		<div
			className={clsx(
				"rounded-[8px] bg-(image:--glass-bg)",
				"p-[4px] border border-glass-border/20 backdrop-blur-md shadow-xl",
				"after:absolute after:bg-(image:--glass-highlight-bg) after:left-4 after:right-4 after:h-px after:top-0",
				"w-fit",
			)}
		>
			{items.map(({ id, node, output: { label } }, index) => (
				<button
					type="button"
					key={id}
					onClick={() => selectItem(index)}
					className={clsx(
						"block w-full text-left px-[8px] py-[6px]",
						"text-[14px] text-text",
						"rounded-[4px]",
						"outline-none cursor-pointer",
						"transition-colors",
						selectedIndex === index
							? "bg-ghost-element-hover"
							: "hover:bg-ghost-element-hover/25",
					)}
				>
					{node.name ?? defaultName(node)} / {label}
				</button>
			))}
		</div>
	);
});

SuggestionList.displayName = "SuggestionList";
