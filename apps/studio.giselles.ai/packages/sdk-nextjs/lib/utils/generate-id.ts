import { customAlphabet } from "nanoid/non-secure";
import { z } from "zod";

/**
 * Creates an ID generator with built-in validation.
 *
 * @param prefix - The prefix for the generated IDs (e.g., 'user', 'message')
 * @returns An object containing ID generation and validation utilities
 *
 * @example
 * const userIds = createIdGenerator('user');
 *
 * // Generate a new ID
 * const newId = userIds.generate(); // "user-1234567890abcdef"
 *
 * // Validate an ID
 * userIds.parse(newId); // ✅ OK
 * userIds.parse("invalid"); // ❌ Throws error
 */
export const createIdGenerator = <T extends string>(prefix: T) => {
	const schema = z
		.string()
		.regex(
			new RegExp(`^${prefix}-[0-9A-Za-z]{16}$`),
			`ID must start with "${prefix}-" followed by 16 alphanumeric characters`,
		)
		.transform((id): `${T}-${string}` => id as `${T}-${string}`);

	const generator = customAlphabet(
		"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
		16,
	);

	const generate = () => `${prefix}-${generator()}` as `${T}-${string}`;

	return {
		schema,
		generate,
		parse: (input: unknown) => schema.parse(input),
		safeParse: (input: unknown) => schema.safeParse(input),
	} as const;
};
