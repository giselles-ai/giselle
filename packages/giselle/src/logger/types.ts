import type { Logger } from "pino";

export type GiselleLogger = Pick<Logger, "info" | "warn" | "error" | "debug">;
