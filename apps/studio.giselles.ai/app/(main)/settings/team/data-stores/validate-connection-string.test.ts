import type dns from "node:dns";
import { describe, expect, it, vi } from "vitest";
import {
	isPrivateIP,
	validateConnectionStringForSSRF,
} from "./validate-connection-string";

let mockLookup: typeof dns.promises.lookup;

vi.mock("node:dns", () => ({
	default: {
		promises: {
			lookup: (...args: Parameters<typeof mockLookup>) =>
				mockLookup(...args),
		},
	},
}));

describe("isPrivateIP", () => {
	it("should return true for 0.0.0.0/8 ('This host' range)", () => {
		expect(isPrivateIP("0.0.0.0")).toBe(true);
		expect(isPrivateIP("0.0.0.1")).toBe(true);
		expect(isPrivateIP("0.255.255.255")).toBe(true);
	});

	it("should return true for localhost (127.x.x.x)", () => {
		expect(isPrivateIP("127.0.0.1")).toBe(true);
		expect(isPrivateIP("127.255.255.255")).toBe(true);
		expect(isPrivateIP("127.0.0.0")).toBe(true);
	});

	it("should return true for Private Class A (10.x.x.x)", () => {
		expect(isPrivateIP("10.0.0.1")).toBe(true);
		expect(isPrivateIP("10.255.255.255")).toBe(true);
		expect(isPrivateIP("10.0.0.0")).toBe(true);
	});

	it("should return true for Carrier-grade NAT (100.64.0.0/10)", () => {
		expect(isPrivateIP("100.64.0.1")).toBe(true);
		expect(isPrivateIP("100.127.255.255")).toBe(true);
		expect(isPrivateIP("100.100.0.0")).toBe(true);
	});

	it("should return false for non-CGNAT 100.x.x.x ranges", () => {
		expect(isPrivateIP("100.63.255.255")).toBe(false);
		expect(isPrivateIP("100.128.0.0")).toBe(false);
	});

	it("should return true for Private Class B (172.16-31.x.x)", () => {
		expect(isPrivateIP("172.16.0.1")).toBe(true);
		expect(isPrivateIP("172.31.255.255")).toBe(true);
		expect(isPrivateIP("172.20.0.0")).toBe(true);
	});

	it("should return false for non-private 172.x.x.x ranges", () => {
		expect(isPrivateIP("172.15.0.1")).toBe(false);
		expect(isPrivateIP("172.32.0.1")).toBe(false);
	});

	it("should return true for IETF Protocol Assignments (192.0.0.0/24)", () => {
		expect(isPrivateIP("192.0.0.1")).toBe(true);
		expect(isPrivateIP("192.0.0.255")).toBe(true);
	});

	it("should return true for Private Class C (192.168.x.x)", () => {
		expect(isPrivateIP("192.168.0.1")).toBe(true);
		expect(isPrivateIP("192.168.255.255")).toBe(true);
	});

	it("should return true for Link-local (169.254.x.x)", () => {
		expect(isPrivateIP("169.254.0.1")).toBe(true);
		expect(isPrivateIP("169.254.169.254")).toBe(true); // AWS metadata
	});

	it("should return true for Benchmarking (198.18.0.0/15)", () => {
		expect(isPrivateIP("198.18.0.1")).toBe(true);
		expect(isPrivateIP("198.19.255.255")).toBe(true);
	});

	it("should return false for non-benchmarking 198.x.x.x ranges", () => {
		expect(isPrivateIP("198.17.255.255")).toBe(false);
		expect(isPrivateIP("198.20.0.0")).toBe(false);
	});

	it("should return true for Multicast (224.0.0.0/4)", () => {
		expect(isPrivateIP("224.0.0.1")).toBe(true);
		expect(isPrivateIP("239.255.255.255")).toBe(true);
		expect(isPrivateIP("230.0.0.0")).toBe(true);
	});

	it("should return true for Reserved (240.0.0.0/4)", () => {
		expect(isPrivateIP("240.0.0.1")).toBe(true);
		expect(isPrivateIP("255.255.255.254")).toBe(true);
	});

	it("should return true for Broadcast (255.255.255.255)", () => {
		expect(isPrivateIP("255.255.255.255")).toBe(true);
	});

	it("should return false for public IP addresses", () => {
		expect(isPrivateIP("8.8.8.8")).toBe(false);
		expect(isPrivateIP("1.1.1.1")).toBe(false);
		expect(isPrivateIP("203.0.113.1")).toBe(false);
	});

	it("should return true for invalid IPv4 addresses (safety default)", () => {
		expect(isPrivateIP("invalid")).toBe(true);
		expect(isPrivateIP("::1")).toBe(true); // IPv6 localhost
		expect(isPrivateIP("2001:db8::1")).toBe(true); // IPv6
	});

	it("should return true for leading zeros (octal bypass prevention)", () => {
		// Leading zeros could be interpreted as octal, e.g., 010 = 8
		expect(isPrivateIP("010.0.0.1")).toBe(true);
		expect(isPrivateIP("127.000.000.001")).toBe(true);
		expect(isPrivateIP("192.168.001.001")).toBe(true);
	});
});

describe("validateConnectionStringForSSRF", () => {
	describe("protocol validation", () => {
		it("should reject http:// protocol", async () => {
			const result = await validateConnectionStringForSSRF(
				"http://example.com/db",
			);
			expect(result.isValid).toBe(false);
			if (!result.isValid) {
				expect(result.error).toContain("postgresql://");
			}
		});

		it("should reject mysql:// protocol", async () => {
			const result = await validateConnectionStringForSSRF(
				"mysql://user:pass@localhost/db",
			);
			expect(result.isValid).toBe(false);
		});

		it("should accept postgresql:// protocol", async () => {
			mockLookup = vi
				.fn()
				.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);

			const result = await validateConnectionStringForSSRF(
				"postgresql://user:pass@example.com:5432/db",
			);
			expect(result.isValid).toBe(true);
		});

		it("should accept postgres:// protocol", async () => {
			mockLookup = vi
				.fn()
				.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);

			const result = await validateConnectionStringForSSRF(
				"postgres://user:pass@example.com:5432/db",
			);
			expect(result.isValid).toBe(true);
		});
	});

	describe("IP address validation (direct IP in connection string)", () => {
		it("should block 0.0.0.0 ('This host')", async () => {
			const result = await validateConnectionStringForSSRF(
				"postgresql://user:pass@0.0.0.0:5432/db",
			);
			expect(result.isValid).toBe(false);
			if (!result.isValid) {
				expect(result.error).toContain("private");
			}
		});

		it("should block localhost IP", async () => {
			const result = await validateConnectionStringForSSRF(
				"postgresql://user:pass@127.0.0.1:5432/db",
			);
			expect(result.isValid).toBe(false);
			if (!result.isValid) {
				expect(result.error).toContain("private");
			}
		});

		it("should block Private Class A IP", async () => {
			const result = await validateConnectionStringForSSRF(
				"postgresql://user:pass@10.0.0.1:5432/db",
			);
			expect(result.isValid).toBe(false);
		});

		it("should block Private Class B IP", async () => {
			const result = await validateConnectionStringForSSRF(
				"postgresql://user:pass@172.16.0.1:5432/db",
			);
			expect(result.isValid).toBe(false);
		});

		it("should block Private Class C IP", async () => {
			const result = await validateConnectionStringForSSRF(
				"postgresql://user:pass@192.168.1.1:5432/db",
			);
			expect(result.isValid).toBe(false);
		});

		it("should block AWS metadata IP", async () => {
			const result = await validateConnectionStringForSSRF(
				"postgresql://user:pass@169.254.169.254:5432/db",
			);
			expect(result.isValid).toBe(false);
		});

		it("should block broadcast address (255.255.255.255)", async () => {
			const result = await validateConnectionStringForSSRF(
				"postgresql://user:pass@255.255.255.255:5432/db",
			);
			expect(result.isValid).toBe(false);
		});

		it("should allow public IP addresses", async () => {
			const result = await validateConnectionStringForSSRF(
				"postgresql://user:pass@8.8.8.8:5432/db",
			);
			expect(result.isValid).toBe(true);
		});
	});

	describe("IPv6 address validation", () => {
		it("should block IPv6 localhost [::1]", async () => {
			const result = await validateConnectionStringForSSRF(
				"postgresql://user:pass@[::1]:5432/db",
			);
			expect(result.isValid).toBe(false);
			if (!result.isValid) {
				expect(result.error).toBe("IPv6 addresses are not supported");
			}
		});

		it("should block IPv6 public addresses (fail-safe)", async () => {
			const result = await validateConnectionStringForSSRF(
				"postgresql://user:pass@[2001:db8::1]:5432/db",
			);
			expect(result.isValid).toBe(false);
			if (!result.isValid) {
				expect(result.error).toBe("IPv6 addresses are not supported");
			}
		});
	});

	describe("query parameter override validation (host/hostaddr)", () => {
		it("should block hostaddr query parameter pointing to private IP", async () => {
			mockLookup = vi
				.fn()
				.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);

			const result = await validateConnectionStringForSSRF(
				"postgresql://user:pass@public.example.com:5432/db?hostaddr=169.254.169.254",
			);
			expect(result.isValid).toBe(false);
			if (!result.isValid) {
				expect(result.error).toContain("private");
			}
		});

		it("should block host query parameter pointing to private IP", async () => {
			mockLookup = vi
				.fn()
				.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);

			const result = await validateConnectionStringForSSRF(
				"postgresql://user:pass@public.example.com:5432/db?host=127.0.0.1",
			);
			expect(result.isValid).toBe(false);
		});

		it("should block hostaddr with localhost", async () => {
			mockLookup = vi
				.fn()
				.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);

			const result = await validateConnectionStringForSSRF(
				"postgresql://user:pass@public.example.com:5432/db?hostaddr=127.0.0.1",
			);
			expect(result.isValid).toBe(false);
		});

		it("should block comma-separated hosts with any private IP", async () => {
			mockLookup = vi
				.fn()
				.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);

			const result = await validateConnectionStringForSSRF(
				"postgresql://user:pass@public.example.com:5432/db?host=8.8.8.8,192.168.1.1",
			);
			expect(result.isValid).toBe(false);
		});

		it("should allow query parameters with public IPs", async () => {
			const result = await validateConnectionStringForSSRF(
				"postgresql://user:pass@8.8.8.8:5432/db?hostaddr=1.1.1.1",
			);
			expect(result.isValid).toBe(true);
		});
	});

	describe("DNS resolution validation", () => {
		it("should block hostname that resolves to private IP", async () => {
			mockLookup = vi
				.fn()
				.mockResolvedValue([{ address: "10.0.0.1", family: 4 }]);

			const result = await validateConnectionStringForSSRF(
				"postgresql://user:pass@internal.example.com:5432/db",
			);
			expect(result.isValid).toBe(false);
		});

		it("should block hostname that resolves to multiple IPs including private", async () => {
			mockLookup = vi.fn().mockResolvedValue([
				{ address: "93.184.216.34", family: 4 },
				{ address: "10.0.0.1", family: 4 },
			]);

			const result = await validateConnectionStringForSSRF(
				"postgresql://user:pass@example.com:5432/db",
			);
			expect(result.isValid).toBe(false);
		});

		it("should allow hostname that resolves to public IP", async () => {
			mockLookup = vi
				.fn()
				.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);

			const result = await validateConnectionStringForSSRF(
				"postgresql://user:pass@example.com:5432/db",
			);
			expect(result.isValid).toBe(true);
		});

		it("should reject unresolvable hostname", async () => {
			mockLookup = vi.fn().mockRejectedValue(new Error("ENOTFOUND"));

			const result = await validateConnectionStringForSSRF(
				"postgresql://user:pass@nonexistent.invalid:5432/db",
			);
			expect(result.isValid).toBe(false);
			if (!result.isValid) {
				expect(result.error).toContain("resolve");
			}
		});
	});

	describe("invalid format handling", () => {
		it("should reject invalid connection string format", async () => {
			const result = await validateConnectionStringForSSRF("not-a-url");
			expect(result.isValid).toBe(false);
			if (!result.isValid) {
				expect(result.error).toContain("Invalid");
			}
		});

		it("should reject connection string without host", async () => {
			const result = await validateConnectionStringForSSRF("postgresql:///db");
			expect(result.isValid).toBe(false);
			if (!result.isValid) {
				expect(result.error).toContain("host");
			}
		});
	});
});
