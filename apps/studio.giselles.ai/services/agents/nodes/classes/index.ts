import type { NodeClasses } from "../types";
import { agent } from "./agent";
import { knowledgeRetrieval } from "./knowledge-retrieval";
import { onRequest } from "./on-request";
import { response } from "./response";
import { text } from "./text";
import { textGeneration } from "./text-generation";
import { webScraping } from "./web-scraper";

export const nodeClasses = {
	onRequest,
	agent,
	response,
	text,
	textGeneration,
	knowledgeRetrieval,
	webScraping,
} satisfies NodeClasses;
