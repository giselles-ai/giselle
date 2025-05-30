/**
 * Lightweight SQL identifier validation for developer-provided values
 *
 * Note: User input values are automatically protected by node-postgres parameterized queries.
 * The pg library handles all escaping via PostgreSQL server's battle-tested parameter
 * substitution code, ensuring protection against SQL injection attacks.
 *
 * See: https://node-postgres.com/features/queries
 * "All escaping is done by the postgresql server ensuring proper behavior across dialects, encodings, etc."
 *
 * This validation is only for developer-provided identifiers (table names, column names)
 * which cannot be parameterized in PostgreSQL.
 */

/**
 * Validates SQL identifiers (table names, column names) that come from developer config
 * This is a basic sanity check for developer-provided values, not protection against
 * malicious user input (which is handled by pg's parameterized queries).
 */
export function validateSqlIdentifier(identifier: string): string {
	if (!identifier) {
		throw new Error("SQL identifier cannot be empty");
	}

	// Basic PostgreSQL identifier rules for developer-provided values
	if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
		throw new Error(
			`Invalid SQL identifier: ${identifier}. Must start with letter/underscore and contain only alphanumeric characters and underscores.`,
		);
	}

	return identifier;
}
