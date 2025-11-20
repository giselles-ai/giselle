export * from "./language-model";

import { anthropic } from "./anthropic";
import { google } from "./google";
import { openai } from "./openai";
import { perplexity } from "./perplexity";

export const languageModels = {
	...openai,
	...anthropic,
	...google,
	...perplexity,
};
