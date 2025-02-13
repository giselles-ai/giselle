"use server";

import { getCurrentMeasurementScope, isRoute06User } from "@/app/(auth)/lib";
import { db, pullMessages } from "@/drizzle";
import { openai } from "@/lib/openai";
import { metrics } from "@opentelemetry/api";
import { and, eq } from "drizzle-orm";
import { insertRequestPortMessage } from "../../../requests/actions";
import type { RequestId } from "../../../requests/types";
import type { Port } from "../../types";

const meter = metrics.getMeter("OpenAI");
const tokenCounter = meter.createCounter("token_consumed", {
	description: "Number of OpenAI API tokens consumed by each request",
});

type AssertContent = (value: unknown) => asserts value is string;
const asssertContent: AssertContent = () => {};

type ActionArgs = {
	requestId: RequestId;
	requestDbId: number;
	nodeDbId: number;
	instructionPort: Port;
	resultPort: Port;
};

export const generateText = async ({
	requestId,
	requestDbId,
	nodeDbId,
	instructionPort,
	resultPort,
}: ActionArgs) => {
	const [instructionMessage] = await db
		.with(pullMessages)
		.select()
		.from(pullMessages)
		.where(
			and(
				eq(pullMessages.requestDbId, requestDbId),
				eq(pullMessages.nodeDbId, nodeDbId),
				eq(pullMessages.portId, instructionPort.id),
			),
		);
	const content = instructionMessage.content;
	asssertContent(content);
	const completion = await openai.chat.completions.create({
		messages: [
			{ role: "system", content: "You are a helpful assistant." },
			{ role: "user", content },
		],
		model: "gpt-4o-mini",
	});
	await insertRequestPortMessage({
		requestId,
		requestDbId,
		portId: resultPort.id,
		message: completion.choices[0].message.content ?? "",
	});
	if (completion.usage && completion.usage.total_tokens !== undefined) {
		const measurementScope = await getCurrentMeasurementScope();
		const isR06User = await isRoute06User();
		tokenCounter.add(completion.usage.total_tokens, {
			measurementScope,
			isR06User,
		});
	}
};
