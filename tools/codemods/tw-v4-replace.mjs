import fs from "node:fs";
import path from "node:path";

const exts = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".pcss"]);
const ignoreDirs = new Set(["node_modules", ".git", ".next", "dist", "build"]);

const root = process.cwd();
const files = [];

function walk(dir) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (entry.isDirectory()) {
			if (ignoreDirs.has(entry.name)) continue;
			walk(path.join(dir, entry.name));
		} else {
			const ext = path.extname(entry.name);
			if (exts.has(ext)) files.push(path.join(dir, entry.name));
		}
	}
}

walk(root);

const patterns = [
	[/text-\[var\(--color-text-inverse(?:,\s*#fff)?\)\]/g, "text-inverse"],
	[/text-\[var\(--color-text\)\]/g, "text-text"],
	[/text-\[var\(--color-background\)\]/g, "text-background"],
	[/text-\[var\(--color-link-muted\)\]/g, "text-link-muted"],
	[
		/placeholder:text-\[var\(--color-link-muted\)\]/g,
		"placeholder:text-link-muted",
	],
	[/bg-\[var\(--color-background\)\]/g, "bg-background"],
	[/bg-\[var\(--color-surface\)\]/g, "bg-surface"],
	[/bg-\[var\(--color-text-inverse(?:,\s*#fff)?\)\]/g, "bg-text-inverse"],
	[/bg-\[var\(--color-chat-bubble-user-bg\)\]/g, "bg-chat-bubble-user-bg"],
	[/bg-\[var\(--color-chat-bubble-accent-bg\)\]/g, "bg-chat-bubble-accent-bg"],
	[/border-\[var\(--color-border\)\]/g, "border-border"],
	[/border-\[var\(--color-border-muted\)\]/g, "border-border-muted"],
	[
		/hover:border-\[var\(--color-text-inverse(?:,\s*#fff)?\)\]/g,
		"hover:border-text-inverse",
	],
	[/outline-\[var\(--color-focused\)\]/g, "outline-focused"],
	[/border-\[var\(--color-border-focused\)\]/g, "border-border-focused"],
	[
		/focus:border-\[var\(--color-border-focused\)\]/g,
		"focus:border-border-focused",
	],
];

let changed = 0;
for (const f of files) {
	const s = fs.readFileSync(f, "utf8");
	let t = s;
	for (const [re, rep] of patterns) {
		t = t.replace(re, rep);
	}
	if (t !== s) {
		fs.writeFileSync(f, t);
		changed++;
	}
}

console.log("files changed:", changed);
