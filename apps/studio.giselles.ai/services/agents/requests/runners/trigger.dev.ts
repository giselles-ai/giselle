// "use server";

// import { db, requestRunners, requests } from "@/drizzle";
// import { requestRunner } from "@/trigger/request";
// import { eq } from "drizzle-orm";
// import type { StartRunnerArgs } from "./types";

// export const start = async (args: StartRunnerArgs) => {
// 	const [request] = await db
// 		.select({ dbId: requests.dbId })
// 		.from(requests)
// 		.where(eq(requests.id, args.requestId));
// 	const runHandle = await requestRunner.trigger({ requestDbId: request.dbId });
// 	await db.insert(requestRunners).values({
// 		requestDbId: request.dbId,
// 		runnerId: runHandle.id,
// 		provider: "trigger",
// 	});
// };
