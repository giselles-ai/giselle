import type { Act } from "@giselles-ai/protocol";

// Patch types - one for each operation
export type Patch =
	| { path: string; set: unknown }
	| { path: string; increment: number }
	| { path: string; decrement: number }
	| { path: string; push: unknown[] };

// Dangerous keys that could lead to prototype pollution
// These keys are blocked to prevent modification of the prototype chain
const DANGEROUS_KEYS = ["__proto__", "constructor", "prototype"];

function isDangerousKey(key: string): boolean {
	return DANGEROUS_KEYS.includes(key);
}

export function patchAct(act: Act, ...patches: Patch[]): Act {
	const result = structuredClone(act);

	for (const patch of patches) {
		// Support both [0] and .0 notation for arrays
		const normalizedPath = patch.path.replace(/\[(\d+)\]/g, ".$1");
		const keys = normalizedPath.split(".");
		const lastKey = keys.pop();

		if (!lastKey) {
			throw new Error(`Invalid path: "${patch.path}"`);
		}

		// Check for dangerous keys to prevent prototype pollution
		if (keys.some(isDangerousKey) || isDangerousKey(lastKey)) {
			throw new Error(`Dangerous path detected: "${patch.path}"`);
		}

		// Navigate to the target object
		// biome-ignore lint/suspicious/noExplicitAny: internal navigation
		let target: any = result;
		for (const key of keys) {
			// Additional check during navigation for defense in depth
			if (isDangerousKey(key)) {
				throw new Error(`Dangerous path detected: "${patch.path}"`);
			}
			target = target[key];
			if (target === undefined) {
				throw new Error(`Path not found: "${patch.path}"`);
			}
		}

		// Apply the patch
		if ("set" in patch) {
			// Additional check before assignment for defense in depth
			if (isDangerousKey(lastKey)) {
				throw new Error(`Dangerous path detected: "${patch.path}"`);
			}
			target[lastKey] = patch.set;
		} else if ("increment" in patch) {
			// Additional check before increment for defense in depth
			if (isDangerousKey(lastKey)) {
				throw new Error(`Dangerous path detected: "${patch.path}"`);
			}
			if (typeof target[lastKey] !== "number") {
				throw new Error(`Cannot increment non-number at path: "${patch.path}"`);
			}
			target[lastKey] += patch.increment;
		} else if ("decrement" in patch) {
			// Additional check before decrement for defense in depth
			if (isDangerousKey(lastKey)) {
				throw new Error(`Dangerous path detected: "${patch.path}"`);
			}
			if (typeof target[lastKey] !== "number") {
				throw new Error(`Cannot decrement non-number at path: "${patch.path}"`);
			}
			target[lastKey] -= patch.decrement;
		} else if ("push" in patch) {
			// Additional check before push for defense in depth
			if (isDangerousKey(lastKey)) {
				throw new Error(`Dangerous path detected: "${patch.path}"`);
			}
			if (!Array.isArray(target[lastKey])) {
				throw new Error(`Cannot push to non-array at path: "${patch.path}"`);
			}
			target[lastKey].push(...patch.push);
		}
	}

	return result;
}
