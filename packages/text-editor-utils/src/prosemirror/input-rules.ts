import {
	InputRule,
	inputRules,
	textblockTypeInputRule,
	wrappingInputRule,
} from "prosemirror-inputrules";
import { type MarkType, NodeType, type Schema } from "prosemirror-model";

function markInputRule(regexp: RegExp, markType: MarkType, getAttrs?: any) {
	return new InputRule(regexp, (state, match, start, end) => {
		const attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs;
		const tr = state.tr;
		if (match[1]) {
			const textStart = start + match[0].indexOf(match[1]);
			const textEnd = textStart + match[1].length;
			if (textEnd < end) tr.delete(textEnd, end);
			if (textStart > start) tr.delete(start, textStart);
			end = start + match[1].length;
		}
		tr.addMark(start, end, markType.create(attrs));
		tr.removeStoredMark(markType);
		return tr;
	});
}

export function buildInputRules(schema: Schema) {
	const rules: InputRule[] = [];

	// Bold input rule: **text**
	if (schema.marks.strong) {
		rules.push(markInputRule(/\*\*([^*]+)\*\*$/, schema.marks.strong));
	}

	// Italic input rule: *text*
	if (schema.marks.em) {
		rules.push(markInputRule(/(?<!\*)\*([^*]+)\*$/, schema.marks.em));
	}

	// Strikethrough input rule: ~~text~~
	if (schema.marks.strike) {
		rules.push(markInputRule(/~~([^~]+)~~$/, schema.marks.strike));
	}

	// Code input rule: `text`
	if (schema.marks.code) {
		rules.push(markInputRule(/`([^`]+)`$/, schema.marks.code));
	}

	// Bullet list input rule: - or *
	if (schema.nodes.bullet_list) {
		rules.push(wrappingInputRule(/^\s*([-+*])\s$/, schema.nodes.bullet_list));
	}

	// Ordered list input rule: 1.
	if (schema.nodes.ordered_list) {
		rules.push(
			wrappingInputRule(
				/^(\d+)\.\s$/,
				schema.nodes.ordered_list,
				(match) => ({
					order: +match[1],
				}),
				(match, node) => node.childCount + node.attrs.order === +match[1],
			),
		);
	}

	// Code block input rule: ```
	if (schema.nodes.code_block) {
		rules.push(textblockTypeInputRule(/^```$/, schema.nodes.code_block));
	}

	return inputRules({ rules });
}
