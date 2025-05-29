import { Fragment, type NodeType, Schema, Slice } from "prosemirror-model";
import { Transaction } from "prosemirror-state";
import {
	ReplaceAroundStep,
	canSplit,
	findWrapping,
	liftTarget,
} from "prosemirror-transform";

export function toggleList(listType: NodeType, itemType: NodeType) {
	return (state: any, dispatch?: any) => {
		const { selection } = state;
		const { $from, $to } = selection;
		const range = $from.blockRange($to);

		if (!range) return false;

		// Check if we're already in this list type
		if (
			range.depth >= 2 &&
			range.$from.node(range.depth - 1).type === listType
		) {
			// We're in this list type, so lift out of it
			return liftListItem(itemType)(state, dispatch);
		}

		// Check if we're in a different list type
		if (
			range.depth >= 2 &&
			(range.$from.node(range.depth - 1).type ===
				state.schema.nodes.bullet_list ||
				range.$from.node(range.depth - 1).type ===
					state.schema.nodes.ordered_list)
		) {
			// Change list type
			return changeListType(listType)(state, dispatch);
		}

		// Wrap in new list
		return wrapInList(listType, itemType)(state, dispatch);
	};
}

export function wrapInList(listType: NodeType, itemType: NodeType) {
	return (state: any, dispatch?: any) => {
		const { selection } = state;
		const { $from, $to } = selection;
		const range = $from.blockRange($to);

		if (!range) return false;

		const wrapping = findWrapping(range, listType, { type: itemType });
		if (!wrapping) return false;

		if (dispatch) {
			const tr = state.tr;
			tr.wrap(range, wrapping);
			dispatch(tr.scrollIntoView());
		}
		return true;
	};
}

export function liftListItem(itemType: NodeType) {
	return (state: any, dispatch?: any) => {
		const { selection } = state;
		const { $from, $to } = selection;
		const range = $from.blockRange(
			$to,
			(node: any) => node.childCount > 0 && node.firstChild!.type === itemType,
		);

		if (!range) return false;

		if ($from.node(range.depth - 1).type !== itemType) return false;

		const target = liftTarget(range);
		if (target == null) return false;

		if (dispatch) {
			const tr = state.tr;
			tr.lift(range, target);
			dispatch(tr.scrollIntoView());
		}
		return true;
	};
}

export function changeListType(listType: NodeType) {
	return (state: any, dispatch?: any) => {
		const { selection } = state;
		const { $from, $to } = selection;
		const range = $from.blockRange($to);

		if (!range) return false;

		// Find the list node
		let listNode = null;
		let listPos = null;
		for (let i = range.depth; i > 0; i--) {
			const node = range.$from.node(i);
			if (
				node.type === state.schema.nodes.bullet_list ||
				node.type === state.schema.nodes.ordered_list
			) {
				listNode = node;
				listPos = range.$from.before(i);
				break;
			}
		}

		if (!listNode || !listPos) return false;

		if (dispatch) {
			const tr = state.tr;
			const newAttrs =
				listType === state.schema.nodes.ordered_list ? { order: 1 } : null;
			tr.setNodeMarkup(listPos, listType, newAttrs);
			dispatch(tr.scrollIntoView());
		}
		return true;
	};
}

export function sinkListItem(itemType: NodeType) {
	return (state: any, dispatch?: any) => {
		const { selection } = state;
		const { $from, $to } = selection;
		const range = $from.blockRange(
			$to,
			(node: any) => node.childCount > 0 && node.firstChild!.type === itemType,
		);

		if (!range) return false;

		const startIndex = range.startIndex;
		if (startIndex === 0) return false;

		const parent = range.parent;
		const nodeBefore = parent.child(startIndex - 1);
		if (nodeBefore.type !== itemType) return false;

		if (dispatch) {
			const tr = state.tr;
			const nestedBefore =
				nodeBefore.lastChild && nodeBefore.lastChild.type === parent.type;
			const inner = nestedBefore ? nodeBefore.lastChild : null;
			const slice = range.slice();

			if (nestedBefore) {
				tr.step(
					new ReplaceAroundStep(
						range.start - 1,
						range.end,
						range.start + range.size,
						range.end,
						slice,
						1,
						true,
					),
				);
			} else {
				const listType = parent.type;
				const newList = listType.create(parent.attrs, slice.content);
				const newItem = itemType.create(
					nodeBefore.attrs,
					nodeBefore.content.append(newList.content),
				);
				tr.replaceWith(range.start - range.startIndex - 1, range.end, newItem);
			}
			dispatch(tr.scrollIntoView());
		}
		return true;
	};
}

export function splitListItem(itemType: NodeType) {
	return (state: any, dispatch?: any) => {
		const { selection } = state;
		const { $from, $to, node } = selection;

		if ((node && node.isBlock) || $from.depth < 2 || !$from.sameParent($to))
			return false;

		const grandParent = $from.node(-1);
		if (grandParent.type !== itemType) return false;

		if ($from.parent.content.size === 0) {
			// Empty item - lift out of list
			return liftListItem(itemType)(state, dispatch);
		}

		if (dispatch) {
			const tr = state.tr;
			tr.split($from.pos);
			dispatch(tr.scrollIntoView());
		}
		return true;
	};
}
