export interface Command {
	callSign: string;
	instruction: string;
}

export function parseCommand(text: string) {
	const lines = text.trim().split("\r\n");

	const commandLine = lines[0];
	const commandMatch = commandLine.match(/^\/giselle\s+([^\]]+)/);
	if (!commandMatch) {
		return null;
	}

	return {
		callSign: commandMatch[1],
		content: lines.slice(1).join("\n").trim(),
	};
}
