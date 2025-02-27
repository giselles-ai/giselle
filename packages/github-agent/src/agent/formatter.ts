interface Base64Object {
	encoding: "base64";
	content: string;
}

interface FormatOptions {
	indent?: string;
	maxUrlLength?: number;
	treeSymbols?: {
		branch: string;
		leaf: string;
		vertical: string;
		space: string;
		corner: string;
		horizontal: string;
		junction: string;
	};
}

export class Formatter {
	private defaultOptions: Required<FormatOptions> = {
		indent: "    ",
		maxUrlLength: 60,
		treeSymbols: {
			branch: "├── ",
			leaf: "└── ",
			vertical: "│   ",
			space: "    ",
			corner: "└── ",
			horizontal: "── ",
			junction: "├── ",
		},
	};

	// List of keys that require special indent processing
	private specialIndentKeys = new Set(["items", "search", "result"]);

	public format(
		results: Map<string, unknown>,
		options: FormatOptions = {},
	): string {
		const opts = { ...this.defaultOptions, ...options };
		// Do not insert extra blank lines between root-level items
		return Array.from(results.entries())
			.map(([key, value]) => {
				const formatted = this.formatValue(value, "", opts);
				return formatted ? `## ${key}\n${formatted}` : `## ${key}`;
			})
			.join("\n");
	}

	private formatMultilineValue(value: string, indent: string): string {
		return value
			.split("\n")
			.map((line) => {
				if (line.trim() === "") {
					// For empty lines, remove trailing spaces from indent
					return indent.replace(/\s+$/, "");
				}
				const leadingSpaces = line.match(/^(\s*)/)?.[1] || "";
				return `${indent}${leadingSpaces}${line.trimStart()}`;
			})
			.join("\n");
	}

	private formatValue(
		value: unknown,
		indent: string,
		opts: Required<FormatOptions>,
		parentKey?: string,
	): string {
		if (value === null || value === undefined || value === "") return "";
		if (this.isBase64Object(value)) {
			return this.formatBase64(value, indent, opts);
		}
		if (Array.isArray(value)) {
			return this.formatArray(value, indent, opts, parentKey);
		}
		if (typeof value === "object") {
			return this.formatObject(value as object, indent, opts);
		}
		const stringValue = String(value);
		if (stringValue.includes("\n")) {
			return this.formatMultilineValue(stringValue, indent);
		}
		return stringValue;
	}

	private getNextIndent(indent: string, isLast: boolean): string {
		return indent + (isLast ? "    " : "│   ");
	}

	private formatObject(
		value: object,
		indent: string,
		opts: Required<FormatOptions>,
	): string {
		const keys = Object.keys(value);
		if (keys.length === 0) return "";

		const entries = Object.entries(value)
			.filter(([, val]) => val !== null && val !== undefined && val !== "")
			.map(([key, val], index, arr) => {
				const isLast = index === arr.length - 1;
				const itemPrefix = isLast
					? opts.treeSymbols.leaf
					: opts.treeSymbols.branch;
				const nextIndent = isLast
					? indent + opts.treeSymbols.space
					: indent + opts.treeSymbols.vertical;

				if (typeof val === "object" && val !== null) {
					const formattedValue = this.formatValue(val, nextIndent, opts, key);
					if (formattedValue === "") {
						return `${indent}${itemPrefix}${key}`;
					}
					return `${indent}${itemPrefix}${key}\n${formattedValue}`;
				}

				const formattedValue = this.formatValue(val, nextIndent, opts, key);
				if (formattedValue.includes("\n")) {
					return `${indent}${itemPrefix}${key}\n${formattedValue}`;
				}
				return `${indent}${itemPrefix}${key} ${formattedValue}`;
			})
			.filter((line) => line !== "");

		return entries.join("\n");
	}

	private formatArray(
		value: unknown[],
		indent: string,
		opts: Required<FormatOptions>,
		parentKey?: string,
	): string {
		if (value.length === 0) return "";

		if (parentKey === "items") {
			return this.formatItemsArray(value, indent, opts);
		}

		const entries: string[] = [];
		value.forEach((item, index, arr) => {
			const isLast = index === arr.length - 1;
			const itemPrefix = isLast
				? opts.treeSymbols.leaf
				: opts.treeSymbols.branch;
			const nextIndent = isLast
				? indent + opts.treeSymbols.space
				: indent + opts.treeSymbols.vertical;

			if (typeof item === "object" && item !== null) {
				if (Array.isArray(item)) {
					entries.push(`${indent}${itemPrefix}[${index}]`);
					const arrayStr = this.formatArray(item, nextIndent, opts);
					if (arrayStr) entries.push(arrayStr);
				} else {
					entries.push(`${indent}${itemPrefix}{${index}}`);
					const objStr = this.formatObject(item, nextIndent, opts);
					if (objStr) entries.push(objStr);
				}
			} else {
				const formattedValue = this.formatValue(item, "", opts);
				entries.push(`${indent}${itemPrefix}${formattedValue}`);
			}
		});

		return entries.join("\n");
	}

	private formatItemsArray(
		value: unknown[],
		indent: string,
		opts: Required<FormatOptions>,
	): string {
		if (value.length === 0) return "";

		const entries: string[] = [];
		for (const item of value) {
			if (typeof item === "object" && item !== null) {
				const objStr = this.formatObject(item, indent, opts);
				if (objStr) entries.push(objStr);
			}
		}

		return entries.join("\n");
	}

	private formatBase64(
		value: Base64Object,
		indent: string,
		opts: Required<FormatOptions>,
	): string {
		try {
			const decoded = this.decodeBase64(value.content);
			return `${indent}${decoded}`;
		} catch (_error) {
			return this.formatObject(value, indent, opts);
		}
	}

	private isBase64Object(value: unknown): value is Base64Object {
		if (!value || typeof value !== "object") return false;
		const obj = value as Record<string, unknown>;
		return (
			"encoding" in obj &&
			"content" in obj &&
			obj.encoding === "base64" &&
			typeof obj.content === "string"
		);
	}

	private decodeBase64(str: string): string {
		try {
			const binary = atob(str);
			const bytes = new Uint8Array(binary.length);
			for (let i = 0; i < binary.length; i++) {
				bytes[i] = binary.charCodeAt(i);
			}
			return new TextDecoder().decode(bytes);
		} catch (_error) {
			throw new Error("Failed to decode base64 string");
		}
	}
}
