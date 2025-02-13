"use server";

import { getApp } from "./app";

export const scrapeWebpage = async (url: string) => {
	return await getApp().scrapeUrl(url);
};
