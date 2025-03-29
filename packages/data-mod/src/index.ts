import type { ZodIssue } from "zod";
import { fixTypoAccesorToAccessor } from "./mods/fix-typo-accesor-to-accessor";

export function dataMod(data: unknown, issue: ZodIssue) {
	let modData = data;
	modData = fixTypoAccesorToAccessor(modData, issue);
	return modData;
}
