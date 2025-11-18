export function formatExecutionCount(count?: number): string {
	if (!count) return "0";
	if (count >= 1000) {
		return `${(count / 1000).toFixed(1)}k`;
	}
	return count.toString();
}
