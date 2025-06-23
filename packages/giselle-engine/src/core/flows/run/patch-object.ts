import type { FlowRunObject } from "./object";

type FlowRunPath = DotPaths<FlowRunObject>;

type PatchValue<T> = T extends number
	? { increment?: number; decrement?: number; set?: number }
	: T extends string
		? { set: string }
		: T extends Array<infer U>
			? {
					push?: U[];
					set?: U[];
				}
			: never;

export type PatchDelta = {
	[P in FlowRunPath]?: PatchValue<Get<FlowRunObject, P>>;
};

export function patchFlowRun(flowRun: FlowRunObject, delta: PatchDelta) {
	const result: FlowRunObject = structuredClone(flowRun);

	for (const key in delta) {
		const patch = delta[key as FlowRunPath];
		if (!patch) continue;

		const parts = key.split(".");
		const lastKey = parts.at(-1);
		if (!lastKey) {
			throw new Error(`Invalid dot path: "${key}"`);
		}
		const pathToLast = parts.slice(0, -1);

		// biome-ignore lint: lint/suspicious/noExplicitAny: internal use
		let target: any = result;
		for (const part of pathToLast) {
			target = target[part];
		}

		const current = target[lastKey];

		if (typeof current === "number" && typeof patch === "object") {
			if ("set" in patch) {
				target[lastKey] = patch.set;
			} else if ("increment" in patch) {
				const inc = patch.increment ?? 0;
				target[lastKey] = current + inc;
			} else if ("decrement" in patch) {
				const dec = patch.decrement ?? 0;
				target[lastKey] = current - dec;
			}
		} else if (typeof current === "string" && typeof patch === "object") {
			if ("set" in patch && patch.set !== undefined) {
				target[lastKey] = patch.set;
			}
		} else if (Array.isArray(current) && typeof patch === "object") {
			if ("set" in patch && patch.set !== undefined) {
				target[lastKey] = patch.set;
			} else {
				const newArray = [...current];

				if ("push" in patch && patch.push) {
					newArray.push(...patch.push);
				}

				target[lastKey] = newArray;
			}
		}
	}

	return result;
}

type IsRecord<T> = T extends Record<string, unknown> ? T : never;

type DotPaths<T, Prefix extends string = "", Depth extends number = 5> = [
	Depth,
] extends [never]
	? never
	: {
			[K in keyof T]: IsRecord<T[K]> extends never
				? `${Prefix}${K & string}`
				:
						| `${Prefix}${K & string}`
						| DotPaths<
								IsRecord<T[K]>,
								`${Prefix}${K & string}.`,
								Decrement[Depth]
						  >;
		}[keyof T];

type Decrement = [never, 0, 1, 2, 3, 4, 5];

type Get<T, Path extends string> = Path extends `${infer K}.${infer R}`
	? K extends keyof T
		? Get<T[K], R>
		: never
	: Path extends keyof T
		? T[Path]
		: never;
