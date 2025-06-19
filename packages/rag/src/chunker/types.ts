/**
 * Function type for chunking text into smaller pieces
 * @param text The text to split
 * @returns The array of chunks
 */
export type ChunkerFunction = (text: string) => string[];
