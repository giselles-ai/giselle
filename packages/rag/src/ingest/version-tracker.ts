interface UpdateRequirement {
	needsEmbedding: boolean;
	needsMetadataUpdate: boolean;
}

/**
 * Creates a version tracker to manage document versions and track changes
 */
export function createVersionTracker(
	existingVersions: Map<string, { version: string; metadataVersion?: string }>,
) {
	const seenDocuments = new Set<string>();

	return {
		checkUpdateRequirement(
			docKey: string,
			newVersion: string,
			newMetadataVersion?: string,
		): UpdateRequirement {
			const existingDoc = existingVersions.get(docKey);

			if (!existingDoc) {
				// New document → needs embedding
				return {
					needsEmbedding: true,
					needsMetadataUpdate: false,
				};
			}

			const contentChanged = existingDoc.version !== newVersion;
			const metadataChanged =
				!!newMetadataVersion &&
				existingDoc.metadataVersion !== newMetadataVersion;

			return {
				needsEmbedding: contentChanged,
				needsMetadataUpdate: !contentChanged && metadataChanged,
			};
		},
		getVersion(docKey: string) {
			return existingVersions.get(docKey);
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
