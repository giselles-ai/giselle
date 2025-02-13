export interface Command {
	callSign: string;
	content: string;
}

export function parseCommand(text: string): Command | null {
	// Normalize line breaks and split into lines
	const normalizedText = text.replace(/\r\n|\r|\n/g, "\n");
	const lines = normalizedText.trim().split("\n");

	const commandLine = lines[0];
	const commandMatch = commandLine.match(/^\/giselle\s+([^\n]+)/);
	if (!commandMatch) {
		return null;
	}

	// Extract callSign (first word) and remaining content
	const parts = commandMatch[1].trim().split(/\s+/);
	const callSign = parts[0];
	const firstLineContent = parts.slice(1).join(" ");

	// Combine remaining content
	const content = [firstLineContent, ...lines.slice(1)].join("\n").trim();

	return {
		callSign,
		content,
	};
}
