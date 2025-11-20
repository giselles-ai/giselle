export * from "./language-model";

import { anthropic } from "./anthropic";
import { google } from "./google";
import { openai } from "./openai";

export const languageModels = {
	...openai,
	...anthropic,
	...google,
};
