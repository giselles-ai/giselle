import { db, pullMessages } from "@/drizzle";
import { scrapeWebpage as firecrawlScrape } from "@/services/external/firecrawl";
import { and, eq } from "drizzle-orm";
import { insertRequestPortMessage } from "../../../requests/actions";
import type { RequestId } from "../../../requests/types";
import type { Port } from "../../types";

type ScrapeWebpageArgs = {
	requestId: RequestId;
	requestDbId: number;
	nodeDbId: number;
	urlPort: Port;
	resultPort: Port;
};
export const scrapeWebpage = async (args: ScrapeWebpageArgs) => {
	const [urlMessage] = await db
		.with(pullMessages)
		.select()
		.from(pullMessages)
		.where(
			and(
				eq(pullMessages.requestDbId, args.requestDbId),
				eq(pullMessages.nodeDbId, args.nodeDbId),
				eq(pullMessages.portId, args.urlPort.id),
			),
		);
	const data = await firecrawlScrape(urlMessage.content);
	if (!data.success) {
		throw new Error(data.error);
	}
	await insertRequestPortMessage({
		requestId: args.requestId,
		requestDbId: args.requestDbId,
		portId: args.resultPort.id,
		message: data.markdown ?? "",
	});
};
