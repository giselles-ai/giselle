"use server";

import { apiKeyEnvVar } from "@/services/external/firecrawl";
import { type PlaygroundOption, playgroundOption } from "./types";

export const resolveOptions = async () => {
	const options: PlaygroundOption[] = [];
	if (process.env[apiKeyEnvVar] !== undefined) {
		options.push(playgroundOption.webscraping);
	}
	return options;
};
