/**
 * Split document string into chunks by lines
 * @param src - document string
 * @param maxLines - 1 chunk line limit
 * @param overlap - line overlap
 */
export function* chunkByLines(src: string, maxLines = 150, overlap = 30) {
	const lines = src.split(/\r?\n/);
	let chunkIndex = 0;
	for (let i = 0; i < lines.length; i += maxLines - overlap) {
		yield {
			content: lines.slice(i, i + maxLines).join("\n"),
			index: chunkIndex,
		};
		chunkIndex++;
	}
}
