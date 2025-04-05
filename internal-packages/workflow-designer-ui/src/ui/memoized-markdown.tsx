import { marked } from "marked";
import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";

function parseMarkdownIntoBlocks(markdown: string): string[] {
    const tokens = marked.lexer(markdown);
    return tokens.map((token) => token.raw);
}

const MemoizedMarkdownBlock = memo(
    ({ content }: { content: string }) => {
        return (
            <ReactMarkdown
                components={{
                    a: ({ node, ...props }) => (
                        <a
                            {...props}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700 underline"
                        />
                    ),
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
