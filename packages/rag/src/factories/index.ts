/**
 * QueryService factory (to be removed in separate PR)
 */

// Re-export types
export type { QueryServiceConfig } from "./types";

// Re-export factory functions (only QueryService remains)
export { createQueryService } from "./factories";
