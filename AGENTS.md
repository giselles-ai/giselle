# Agent Workflow

Follow these guidelines when editing this repository.

## Commands
- **Build SDK**: `pnpm build-sdk` 
  - Add `--filter <package>` to build specific packages.
- **Check Types**: `pnpm check-types`
  - Use `--filter <package>` for package-level checks.
- **Format**: `pnpm format` 
  - Prefer `pnpm biome check --write [filename]` for individual files.
- **Test**: `pnpm test`
  - Run `pnpm -F <package> test` for package-level tests.

## Formatting
- Run `pnpm biome check --write [filename]` after every code change.
- All code must be formatted with Biome before commit.

## Style
- Use TypeScript and avoid `any`.
- Components should use React hooks and Next.js patterns.
- Follow package-based architecture.
- Use async/await and proper error handling.
- Tests use Vitest with `*.test.ts` naming.

## Naming
- Files: kebab-case.
- Components: PascalCase.
- Variables/functions: camelCase.
- Booleans and functions use `is`, `has`, `can`, `should` prefixes.
- Function names should clearly indicate purpose.

## Communication
- Correct grammar in commit messages, code comments, and PR comments.
