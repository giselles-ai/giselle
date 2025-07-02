export interface FileDiff {
	fileName: string;
	content: string;
	size: number;
	header: string;
}

const DEFAULT_PULL_REQUEST_DIFF_MAX_SIZE = 200_000;

export function compressLargeDiff(
	diff: string,
	maxSize = DEFAULT_PULL_REQUEST_DIFF_MAX_SIZE,
): string {
	if (diff.length <= maxSize) {
		return diff;
	}

	// Replace encoded data with placeholders before processing
	const processedDiff = replaceEncodedData(diff);
	const fileDiffs = parseFileDiffs(processedDiff);

	fileDiffs.sort((a, b) => b.size - a.size);
	const totalHeaderSize = fileDiffs.reduce((sum, file) => {
		const headerSize = file.content
			.split("\n")
			.filter((line) => isHeaderLine(line))
			.join("\n").length;
		return sum + headerSize;
	}, 0);

	const availableForContent = maxSize - totalHeaderSize;
	const totalContentSize =
		fileDiffs.reduce((sum, file) => sum + file.size, 0) - totalHeaderSize;
	const compressionRatio = Math.min(1, availableForContent / totalContentSize);

	const compressedFiles = fileDiffs.map((file) => {
		const headerSize = file.content
			.split("\n")
			.filter((line) => isHeaderLine(line))
			.join("\n").length;
		const contentSize = file.size - headerSize;
		const targetContentSize = Math.floor(contentSize * compressionRatio);
		const targetTotalSize = headerSize + targetContentSize;

		return compressFileDiff(file, targetTotalSize);
	});

	return compressedFiles.join("\n");
}

function parseFileDiffs(diff: string): FileDiff[] {
	const lines = diff.split("\n");
	const fileDiffs: FileDiff[] = [];
	let currentFile: FileDiff | null = null;

	for (const line of lines) {
		if (line.startsWith("diff --git")) {
			if (currentFile) {
				fileDiffs.push(currentFile);
			}

			const fileName = extractFileName(line);
			currentFile = {
				fileName,
				content: `${line}\n`,
				size: line.length + 1,
				header: line,
			};
		} else if (currentFile) {
			currentFile.content += `${line}\n`;
			currentFile.size += line.length + 1;
		}
	}

	if (currentFile) {
		fileDiffs.push(currentFile);
	}

	return fileDiffs;
}

function compressFileDiff(fileDiff: FileDiff, targetSize: number): string {
	if (fileDiff.size <= targetSize) {
		return fileDiff.content.trim();
	}

	const lines = fileDiff.content.split("\n");
	let result = "";
	let currentSize = 0;

	const headerLines: string[] = [];
	const contentLines: string[] = [];

	for (const line of lines) {
		if (isHeaderLine(line)) {
			headerLines.push(line);
		} else {
			contentLines.push(line);
		}
	}

	const headerContent = `${headerLines.join("\n")}\n`;
	result = headerContent;
	currentSize = headerContent.length;

	const remainingSize = targetSize - currentSize - 4;
	let contentAdded = "";

	for (const line of contentLines) {
		const lineWithNewline = `${line}\n`;
		if (currentSize + lineWithNewline.length <= remainingSize) {
			contentAdded += lineWithNewline;
			currentSize += lineWithNewline.length;
		} else {
			break;
		}
	}

	result += contentAdded;

	if (contentLines.length > contentAdded.split("\n").length - 1) {
		result += "...\n";
	}

	return result.trim();
}

function isHeaderLine(line: string): boolean {
	return (
		line.startsWith("diff --git") ||
		line.startsWith("index ") ||
		line.startsWith("+++") ||
		line.startsWith("---") ||
		line.startsWith("@@") ||
		line.match(/^new file mode/) !== null ||
		line.match(/^deleted file mode/) !== null
	);
}

function replaceEncodedData(content: string): string {
	let result = content;

	// Replace data URLs with base64 content
	result = result.replace(
		/data:([^;]+);base64,[A-Za-z0-9+/]{20,}=*/g,
		"data:$1;base64,<ENCODED DATA>",
	);

	// Replace base64 strings in JSON responses (common in API data)
	result = result.replace(
		/"([^"]*)":\s*"[A-Za-z0-9+/]{50,}=*"/g,
		'"$1":"<ENCODED DATA>"',
	);

	// Replace standalone base64 strings (images, files, etc.)
	result = result.replace(
		/^[\s]*[+-]?[A-Za-z0-9+/]{100,}=*[\s]*$/gm,
		"<ENCODED DATA>",
	);

	// Replace base64 in various formats with line breaks
	result = result.replace(/[A-Za-z0-9+/]{80,}=*/g, "<ENCODED DATA>");

	// Replace multiline base64 blocks (common in diffs)
	result = result.replace(
		/(\+|-|\s)([A-Za-z0-9+/]{40,}[=]{0,2}(\n(\+|-|\s)[A-Za-z0-9+/]{40,}[=]{0,2}){3,})/g,
		"$1<ENCODED DATA>",
	);

	// Replace hex-encoded data (long hex strings)
	result = result.replace(/[0-9a-fA-F]{100,}/g, "<ENCODED HEX DATA>");

	return result;
}

function extractFileName(diffLine: string): string {
	const match = diffLine.match(/diff --git a\/(.+?) b\//);
	return match ? match[1] : "unknown";
}
