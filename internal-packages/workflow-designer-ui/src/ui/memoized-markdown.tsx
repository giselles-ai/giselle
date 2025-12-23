import hljs from "highlight.js";
import { marked } from "marked";
import type { ComponentProps } from "react";
import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function parseMarkdownIntoBlocks(markdown: string): string[] {
	const tokens = marked.lexer(markdown);
	return tokens.map((token) => token.raw);
}

const languageAliases: Record<string, string> = {
	js: "javascript",
	jsx: "javascript",
	ts: "typescript",
	tsx: "typescript",
	sh: "bash",
	shell: "bash",
	yml: "yaml",
	md: "markdown",
};

function normalizeLanguage(language: string | undefined): string | null {
	if (!language) return null;
	const normalized = language.toLowerCase();
	const mapped = languageAliases[normalized] ?? normalized;
	return hljs.getLanguage(mapped) ? mapped : null;
}

type MarkdownCodeProps = ComponentProps<"code"> & { inline?: boolean };

const MemoizedMarkdownBlock = memo(
	({ content }: { content: string }) => {
		return (
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				components={{
					// Customize anchor tags (links)
					a: ({ node, children, ...props }) => (
						<a
							{...props}
							target="_blank"
							rel="noopener noreferrer"
							className="underline"
						>
							{children}
						</a>
					),
					code: ({
						inline,
						className,
						children,
						...props
					}: MarkdownCodeProps) => {
						if (inline) {
							return (
								<code className={className} {...props}>
									{children}
								</code>
							);
						}

						const match = /language-([a-zA-Z0-9_-]+)/.exec(className ?? "");
						const rawLanguage = match?.[1];
						const language = normalizeLanguage(rawLanguage);
						const rawCode = String(children ?? "");
						const code = rawCode.endsWith("\n")
							? rawCode.slice(0, -1)
							: rawCode;

						// We only highlight when a language is explicitly provided (no guessing).
						if (!language) {
							return (
								<code className={className} {...props}>
									{code}
								</code>
							);
						}

						const html = hljs.highlight(code, {
							language,
							ignoreIllegals: true,
						}).value;

						return (
							<code
								className={[className, "hljs"].filter(Boolean).join(" ")}
								// highlight.js returns HTML with spans; safe for our controlled content.
								// biome-ignore lint/security/noDangerouslySetInnerHtml: required for syntax highlighting
								dangerouslySetInnerHTML={{ __html: html }}
								{...props}
							/>
						);
					},
				}}
			>
				{content}
			</ReactMarkdown>
		);
	},
	(prevProps, nextProps) => {
		if (prevProps.content !== nextProps.content) return false;
		return true;
	},
);

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock";

export const MemoizedMarkdown = memo(({ content }: { content: string }) => {
	const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

	return blocks.map((block, index) => (
		<MemoizedMarkdownBlock
			content={block}
			key={`block_${
				// biome-ignore lint/suspicious/noArrayIndexKey: for internal use
				index
			}`}
		/>
	));
});

MemoizedMarkdown.displayName = "MemoizedMarkdown";
