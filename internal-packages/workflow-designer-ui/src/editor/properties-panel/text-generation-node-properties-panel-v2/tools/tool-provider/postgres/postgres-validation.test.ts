import { describe, expect, it } from "vitest";
import { validatePostgreSQLConnectionString } from "./postgres-validation";

// Helper function to assert error exists
function assertError(result: {
	isValid: boolean;
	error?: string;
}): asserts result is { isValid: false; error: string } {
	if (result.isValid || !result.error) {
		throw new Error("Expected error but result was valid");
	}
}

describe("validatePostgreSQLConnectionString", () => {
	describe("URI format validation", () => {
		describe("valid connection strings", () => {
			it("should accept basic PostgreSQL URI", () => {
				const result = validatePostgreSQLConnectionString(
					"postgresql://user:password@localhost/db",
				);
				expect(result.isValid).toBe(true);
			});

			it("should accept postgres:// scheme", () => {
				const result = validatePostgreSQLConnectionString(
					"postgres://user:password@localhost/db",
				);
				expect(result.isValid).toBe(true);
			});

			it("should accept URI without password", () => {
				const result = validatePostgreSQLConnectionString(
					"postgresql://user@localhost/db",
				);
				expect(result.isValid).toBe(true);
			});

			it("should accept URI without authentication", () => {
				const result = validatePostgreSQLConnectionString(
					"postgresql://localhost/db",
				);
				expect(result.isValid).toBe(true);
			});

			it("should accept URI with port", () => {
				const result = validatePostgreSQLConnectionString(
					"postgresql://user:password@localhost:5432/db",
				);
				expect(result.isValid).toBe(true);
			});

			it("should accept URI with query parameters", () => {
				const result = validatePostgreSQLConnectionString(
					"postgresql://user:password@localhost/db?sslmode=require&connect_timeout=10",
				);
				expect(result.isValid).toBe(true);
			});

			it("should accept properly encoded special characters", () => {
				const result = validatePostgreSQLConnectionString(
					"postgresql://user%40domain:p%40ssw0rd%21@localhost/db",
				);
				expect(result.isValid).toBe(true);
			});

			it("should accept URI with multiple @ in password when properly encoded", () => {
				const result = validatePostgreSQLConnectionString(
					"postgresql://user:pass%40word@localhost/db",
				);
				expect(result.isValid).toBe(true);
			});

			it("should accept URI with encoded database name", () => {
				const result = validatePostgreSQLConnectionString(
					"postgresql://user:password@localhost/my%20database",
				);
				expect(result.isValid).toBe(true);
			});

			it("should accept URI with IPv6 host", () => {
				const result = validatePostgreSQLConnectionString(
					"postgresql://user:password@[::1]/db",
				);
				expect(result.isValid).toBe(true);
			});

			it("should accept URI with domain name", () => {
				const result = validatePostgreSQLConnectionString(
					"postgresql://user:password@db.example.com/database",
				);
				expect(result.isValid).toBe(true);
			});
		});

		describe("invalid connection strings", () => {
			it("should reject empty string", () => {
				const result = validatePostgreSQLConnectionString("");
				expect(result.isValid).toBe(false);
				assertError(result);
				expect(result.error).toBe("Connection string cannot be empty");
			});

			it("should reject whitespace only", () => {
				const result = validatePostgreSQLConnectionString("   ");
				expect(result.isValid).toBe(false);
				assertError(result);
				expect(result.error).toBe("Connection string cannot be empty");
			});

			it("should reject invalid scheme", () => {
				const result = validatePostgreSQLConnectionString(
					"mysql://user:password@localhost/db",
				);
				expect(result.isValid).toBe(false);
				assertError(result);
				expect(result.error).toContain(
					"Invalid connection string format. It should start with `postgresql://`",
				);
			});

			it("should reject connection string without scheme (issue example)", () => {
				const result = validatePostgreSQLConnectionString(
					"myuser:mypassword@myhost/mydatabase",
				);
				expect(result.isValid).toBe(false);
				assertError(result);
				expect(result.error).toBe(
					"Invalid connection string format. It should start with `postgresql://`.",
				);
			});

			it("should reject unencoded @ in username", () => {
				const result = validatePostgreSQLConnectionString(
					"postgresql://user@domain:password@localhost/db",
				);
				expect(result.isValid).toBe(false);
				assertError(result);
				expect(result.error).toContain(
					"The username contains a special character ('@') that should be percent-encoded to '%40'",
				);
			});

			it("should reject unencoded @ in password", () => {
				const result = validatePostgreSQLConnectionString(
					"postgresql://user:p@ssword@localhost/db",
				);
				expect(result.isValid).toBe(false);
				assertError(result);
				expect(result.error).toContain(
					"The password contains a special character ('@') that should be percent-encoded to '%40'",
				);
			});

			it("should reject unencoded # in password (issue example)", () => {
				const result = validatePostgreSQLConnectionString(
					"postgresql://myuser:my#password@myhost/mydatabase",
				);
				expect(result.isValid).toBe(false);
				assertError(result);
				expect(result.error).toBe(
					"The password contains a special character ('#') that should be percent-encoded to '%23'.",
				);
			});

			it("should reject unencoded space in database name", () => {
				const result = validatePostgreSQLConnectionString(
					"postgresql://user:password@localhost/my database",
				);
				expect(result.isValid).toBe(false);
				assertError(result);
				expect(result.error).toContain(
					"The database name contains a special character (' ') that should be percent-encoded to '%20'",
				);
			});

			it("should reject invalid port number", () => {
				const result = validatePostgreSQLConnectionString(
					"postgresql://user:password@localhost:99999/db",
				);
				expect(result.isValid).toBe(false);
				assertError(result);
				expect(result.error).toBe("The port '99999' is not a valid number.");
			});

			it("should reject non-numeric port", () => {
				const result = validatePostgreSQLConnectionString(
					"postgresql://user:password@localhost:abc/db",
				);
				expect(result.isValid).toBe(false);
				assertError(result);
				expect(result.error).toBe("The port 'abc' is not a valid number.");
			});

			it("should reject non-numeric port (issue example)", () => {
				const result = validatePostgreSQLConnectionString(
					"postgresql://myuser:mypassword@myhost:abcd/mydatabase",
				);
				expect(result.isValid).toBe(false);
				assertError(result);
				expect(result.error).toBe("The port 'abcd' is not a valid number.");
			});

			it("should reject invalid query parameter format", () => {
				const result = validatePostgreSQLConnectionString(
					"postgresql://user:password@localhost/db?invalid",
				);
				expect(result.isValid).toBe(false);
				assertError(result);
				expect(result.error).toBe(
					"Invalid parameter format. Expected 'key=value'",
				);
			});

			it("should reject invalid sslmode value", () => {
				const result = validatePostgreSQLConnectionString(
					"postgresql://user:password@localhost/db?sslmode=invalid",
				);
				expect(result.isValid).toBe(false);
				assertError(result);
				expect(result.error).toBe(
					"Invalid sslmode value 'invalid'. Valid values are: disable, allow, prefer, require, verify-ca, verify-full",
				);
			});

			it("should reject unencoded special characters in query parameters", () => {
				const result = validatePostgreSQLConnectionString(
					"postgresql://user:password@localhost/db?param=value with spaces",
				);
				expect(result.isValid).toBe(false);
				assertError(result);
				expect(result.error).toBe(
					"Invalid parameter format. Expected 'key=value'",
				);
			});

			it("should reject invalid percent encoding", () => {
				const result = validatePostgreSQLConnectionString(
					"postgresql://user%ZZ:password@localhost/db",
				);
				expect(result.isValid).toBe(false);
				assertError(result);
				expect(result.error).toBe(
					"The username contains invalid percent-encoding",
				);
			});

			it("should reject incomplete percent encoding", () => {
				const result = validatePostgreSQLConnectionString(
					"postgresql://user%4:password@localhost/db",
				);
				expect(result.isValid).toBe(false);
				assertError(result);
				expect(result.error).toBe(
					"The username contains invalid percent-encoding",
				);
			});
		});
	});

	describe("Key-Value format validation", () => {
		describe("valid connection strings", () => {
			it("should accept basic key-value format", () => {
				const result = validatePostgreSQLConnectionString(
					"host=localhost port=5432 dbname=mydb user=myuser password=mypassword",
				);
				expect(result.isValid).toBe(true);
			});

			it("should accept quoted values", () => {
				const result = validatePostgreSQLConnectionString(
					"host=localhost password='my password with spaces'",
				);
				expect(result.isValid).toBe(true);
			});

			it("should accept minimal parameters", () => {
				const result = validatePostgreSQLConnectionString("host=localhost");
				expect(result.isValid).toBe(true);
			});

			it("should accept multiple spaces between parameters", () => {
				const result = validatePostgreSQLConnectionString(
					"host=localhost    port=5432    dbname=mydb",
				);
				expect(result.isValid).toBe(true);
			});

			it("should accept all recognized parameters", () => {
				const result = validatePostgreSQLConnectionString(
					"host=localhost port=5432 dbname=mydb user=myuser password=mypassword sslmode=require",
				);
				expect(result.isValid).toBe(true);
			});
		});

		describe("invalid connection strings", () => {
			it("should reject unrecognized parameters", () => {
				const result = validatePostgreSQLConnectionString(
					"host=localhost invalid_param=value",
				);
				expect(result.isValid).toBe(false);
				assertError(result);
				expect(result.error).toBe(
					"'invalid_param' is not a recognized parameter",
				);
			});

			it("should suggest closest parameter match", () => {
				const result = validatePostgreSQLConnectionString("hosts=localhost");
				expect(result.isValid).toBe(false);
				assertError(result);
				expect(result.error).toBe(
					"'hosts' is not a recognized keyword. Did you mean 'host'?",
				);
			});

			it("should suggest dbname for db", () => {
				const result = validatePostgreSQLConnectionString("db=mydb");
				expect(result.isValid).toBe(false);
				assertError(result);
				expect(result.error).toBe(
					"'db' is not a recognized keyword. Did you mean 'dbname'?",
				);
			});

			it("should suggest dbname for db (issue example)", () => {
				const result = validatePostgreSQLConnectionString(
					"host=myhost port=5432 db=mydatabase",
				);
				expect(result.isValid).toBe(false);
				assertError(result);
				expect(result.error).toBe(
					"'db' is not a recognized keyword. Did you mean 'dbname'?",
				);
			});

			it("should reject invalid format without equals sign", () => {
				const result = validatePostgreSQLConnectionString("host localhost");
				expect(result.isValid).toBe(false);
				assertError(result);
				expect(result.error).toBe(
					"Invalid format. Expected 'key=value' pairs separated by spaces",
				);
			});

			it("should reject unclosed quotes", () => {
				const result = validatePostgreSQLConnectionString(
					"host=localhost password='unclosed",
				);
				expect(result.isValid).toBe(false);
				assertError(result);
				expect(result.error).toBe(
					"Invalid format. Expected 'key=value' pairs separated by spaces",
				);
			});

			it("should reject invalid port in key-value format", () => {
				const result = validatePostgreSQLConnectionString(
					"host=localhost port=invalid",
				);
				expect(result.isValid).toBe(false);
				assertError(result);
				expect(result.error).toBe("The port 'invalid' is not a valid number.");
			});

			it("should reject invalid sslmode in key-value format", () => {
				const result = validatePostgreSQLConnectionString(
					"host=localhost sslmode=invalid",
				);
				expect(result.isValid).toBe(false);
				assertError(result);
				expect(result.error).toBe(
					"Invalid sslmode value 'invalid'. Valid values are: disable, allow, prefer, require, verify-ca, verify-full",
				);
			});

			it("should reject empty key", () => {
				const result = validatePostgreSQLConnectionString("=value");
				expect(result.isValid).toBe(false);
				assertError(result);
				// The actual error message is different because the parser successfully
				// extracts an empty key and "value" as the value
				expect(result.error).toBe(
					"Invalid parameter format. Both key and value are required",
				);
			});

			it("should reject empty value", () => {
				const result = validatePostgreSQLConnectionString("host=");
				expect(result.isValid).toBe(false);
				assertError(result);
				expect(result.error).toBe(
					"Invalid parameter format. Both key and value are required",
				);
			});
		});
	});

	describe("edge cases", () => {
		it("should handle connection string with leading/trailing whitespace", () => {
			const result = validatePostgreSQLConnectionString(
				"  postgresql://user:password@localhost/db  ",
			);
			expect(result.isValid).toBe(true);
		});

		it("should handle very long connection strings", () => {
			const longParams = Array(20)
				.fill(0)
				.map((_, i) => `param${i}=value${i}`)
				.join("&");
			const result = validatePostgreSQLConnectionString(
				`postgresql://user:password@localhost/db?${longParams}`,
			);
			expect(result.isValid).toBe(true);
		});

		it("should handle connection string with only scheme", () => {
			const result = validatePostgreSQLConnectionString("postgresql://");
			expect(result.isValid).toBe(false);
			assertError(result);
			expect(result.error).toBe("Invalid host format in connection string.");
		});

		it("should handle malformed URI", () => {
			const result = validatePostgreSQLConnectionString(
				"postgresql://[invalid",
			);
			expect(result.isValid).toBe(false);
			assertError(result);
			expect(result.error).toBe("Invalid host format in connection string.");
		});
	});
});
