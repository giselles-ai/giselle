/**
 * Creates a version tracker to manage document versions and track changes
 */
export function createVersionTracker(existingVersions: Map<string, string>) {
	const seenDocuments = new Set<string>();

	return {
		isUpdateNeeded(docKey: string, newVersion: string): boolean {
			const existingVersion = existingVersions.get(docKey);
			return existingVersion !== newVersion;
		},
		trackSeen(docKey: string): void {
			seenDocuments.add(docKey);
		},
		getOrphaned(): string[] {
			return Array.from(existingVersions.keys()).filter(
				(key) => !seenDocuments.has(key),
			);
		},
	};
}
