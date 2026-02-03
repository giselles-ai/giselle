# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Implement SSRF protection for PostgreSQL connection strings at data store registration
- Block connections to private/internal IP addresses
- Prevent access to cloud metadata services (169.254.169.254)
- Only allow postgresql:// or postgres:// protocols

## Goal (incl. success criteria)

- Execute SSRF validation in createDataStore and updateDataStore
- Blocked ranges (RFC 6890):
  - 0.0.0.0/8 ("This host")
  - 127.0.0.0/8 (Localhost)
  - 10.0.0.0/8 (Private Class A)
  - 100.64.0.0/10 (Carrier-grade NAT)
  - 172.16.0.0/12 (Private Class B)
  - 192.0.0.0/24 (IETF Protocol Assignments)
  - 192.168.0.0/16 (Private Class C)
  - 169.254.0.0/16 (Link-local / AWS metadata)
  - 198.18.0.0/15 (Benchmarking)
  - 224.0.0.0/4 (Multicast)
  - 240.0.0.0/4 (Reserved)
  - 255.255.255.255 (Broadcast)
- Validate host/hostaddr query parameters (libpq bypass prevention)
- No additional dependencies - use Node.js standard URL API
- Test coverage: protocol, IP, DNS, IPv6, query parameters

## Constraints/Assumptions

- Scope limited to `apps/studio.giselles.ai/app/(main)/settings/team/data-stores/actions.ts`
- Other Pool creation points (execute-data-query.ts etc.) are out of scope (no defense in depth)
- IPv6 addresses blocked entirely (fail-safe approach)
- Leading zeros in IP rejected to prevent octal interpretation bypass
- Use standard URL API instead of pg-connection-string

## Key decisions

- Place validate-connection-string.ts in same directory as actions.ts
- Use vi.mock() pattern to mock DNS lookup in tests
- IPv6 not supported - all blocked as fail-safe
- Block host/hostaddr query parameters to prevent libpq bypass attacks
- Reject leading zeros in IP addresses (e.g., 010.0.0.1) for consistency

## State

- Implementation complete (with PR review feedback addressed)
- All verification passed: format, check-types, test (45 tests)

## Done

- Created validate-connection-string.ts (isPrivateIP, validateHost, validateConnectionStringForSSRF)
- Created validate-connection-string.test.ts (45 test cases)
- Added validation calls to actions.ts (createDataStore, updateDataStore)
- Created branch: fix/ssrf-protection-data-store
- Created PR #2699
- Addressed PR review feedback:
  - Added 0.0.0.0/8 blocking (Cursor Bugbot)
  - Added host/hostaddr query parameter validation (Codex)
  - Added RFC 6890 special-use IP ranges
  - Made isPrivateIP consistent with isIPv4Address (leading zeros rejection)
  - Added IPv6, URL-encoded, query parameter tests

## Now

- Awaiting commit and push for review feedback changes

## Next

- Commit and push changes
- Update PR

## Open questions (UNCONFIRMED if needed)

- DNS rebinding / TOCTOU vulnerability (documented but not addressed - would require runtime re-validation)

## Working set (files/ids/commands)

- `apps/studio.giselles.ai/app/(main)/settings/team/data-stores/validate-connection-string.ts`
- `apps/studio.giselles.ai/app/(main)/settings/team/data-stores/validate-connection-string.test.ts`
- `apps/studio.giselles.ai/app/(main)/settings/team/data-stores/actions.ts`
