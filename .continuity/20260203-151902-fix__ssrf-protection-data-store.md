# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Implement SSRF protection for PostgreSQL connection strings at data store registration
- Block connections to private/internal IP addresses
- Prevent access to cloud metadata services (169.254.169.254)
- Only allow postgresql:// or postgres:// protocols

## Goal (incl. success criteria)

- Execute SSRF validation in createDataStore and updateDataStore
- Blocked ranges: 127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16
- No additional dependencies - use Node.js standard URL API
- Test coverage: protocol validation, IP validation, DNS resolution validation

## Constraints/Assumptions

- Scope limited to `apps/studio.giselles.ai/app/(main)/settings/team/data-stores/actions.ts`
- Other Pool creation points (execute-data-query.ts etc.) are out of scope (no defense in depth)
- IPv6 currently blocked entirely (fail-safe approach)
- Use standard URL API instead of pg-connection-string

## Key decisions

- Place validate-connection-string.ts in same directory as actions.ts
- Use vi.mock() pattern to mock DNS lookup in tests
- IPv6 not supported - all blocked as fail-safe

## State

- Implementation complete
- All verification passed: format, build-sdk, check-types, tidy, test

## Done

- Created validate-connection-string.ts (isPrivateIP, validateConnectionStringForSSRF)
- Created validate-connection-string.test.ts (24 test cases)
- Added validation calls to actions.ts (createDataStore, updateDataStore)
- Created branch: fix/ssrf-protection-data-store

## Now

- Awaiting commit

## Next

- Create commit
- Create PR

## Open questions (UNCONFIRMED if needed)

- Whether proper IPv6 support is needed (currently all blocked)

## Working set (files/ids/commands)

- `apps/studio.giselles.ai/app/(main)/settings/team/data-stores/validate-connection-string.ts`
- `apps/studio.giselles.ai/app/(main)/settings/team/data-stores/validate-connection-string.test.ts`
- `apps/studio.giselles.ai/app/(main)/settings/team/data-stores/actions.ts`
