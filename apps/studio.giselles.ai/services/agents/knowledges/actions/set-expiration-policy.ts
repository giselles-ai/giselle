"use server";

import { openai } from "@/lib/openai";
import type { VectorStoreUpdateParams } from "openai/resources/beta/vector-stores/vector-stores";

type SetExpirationPolicyArgs = {
	vectorStoreId: string;
	expirationPolicy: VectorStoreUpdateParams.ExpiresAfter;
};
export const setExpirationPolicy = async (args: SetExpirationPolicyArgs) => {
	await openai.beta.vectorStores.update(args.vectorStoreId, {
		expires_after: args.expirationPolicy,
	});
};
