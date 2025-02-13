"use server";

import { builds, db, requests } from "@/drizzle";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import type { Port } from "../../nodes/types";
import { insertRequestPortMessage } from "./insert-request-port-message";

type RequestParameter = {
	portId: Port["id"];
	value: string;
};
type CreateRequestArgs = {
	buildId: (typeof builds.$inferInsert)["id"];
	parameters: RequestParameter[];
};
export const createRequest = async (args: CreateRequestArgs) => {
	const [build] = await db
		.select({ dbId: builds.dbId })
		.from(builds)
		.where(eq(builds.id, args.buildId));
	const id = `rqst_${createId()}` as const;
	const [newRequest] = await db
		.insert(requests)
		.values({
			id: id,
			buildDbId: build.dbId,
		})
		.returning({
			dbId: requests.dbId,
		});
	await Promise.all(
		args.parameters.map((parameter) =>
			insertRequestPortMessage({
				requestId: id,
				requestDbId: newRequest.dbId,
				portId: parameter.portId,
				message: parameter.value,
			}),
		),
	);
	return { id, dbId: newRequest.dbId };
};
