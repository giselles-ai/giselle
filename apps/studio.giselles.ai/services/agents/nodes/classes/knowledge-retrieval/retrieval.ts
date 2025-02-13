"use server";

import { db, pullMessages } from "@/drizzle";
import { openai } from "@/lib/openai";
import { and, eq } from "drizzle-orm";
import type { Message } from "openai/resources/beta/threads/messages";
import { insertRequestPortMessage } from "../../../requests/actions";
import type { RequestId } from "../../../requests/types";
import type { Port } from "../../types";

type AssertContent = (value: unknown) => asserts value is string;
const asssertContent: AssertContent = () => {};

const messageToText = (message: Message) => {
	let result = "";
	for (const part of message.content) {
		if (part.type === "text") {
			result += part.text.value;
		}
		if (part.type === "image_url") {
			/** @todo */
			result += "🖼";
		}
		if (part.type === "image_file") {
			/** @todo */
			result += "📁";
		}
	}
	return result;
};

type RetrievalArgs = {
	openaiAssistantId: string;
	queryPort: Port;
	resultPort: Port;
	requestId: RequestId;
	requestDbId: number;
	nodeDbId: number;
};
export const retrieval = async (args: RetrievalArgs) => {
	const [queryMessage] = await db
		.with(pullMessages)
		.select()
		.from(pullMessages)
		.where(
			and(
				eq(pullMessages.requestDbId, args.requestDbId),
				eq(pullMessages.nodeDbId, args.nodeDbId),
				eq(pullMessages.portId, args.queryPort.id),
			),
		);
	const content = queryMessage.content;
	asssertContent(content);
	const thread = await openai.beta.threads.create({
		messages: [
			{
				role: "user",
				content,
			},
		],
	});
	const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
		assistant_id: args.openaiAssistantId,
	});
	const messagesPage = await openai.beta.threads.messages.list(run.thread_id, {
		order: "desc",
		limit: 1,
	});
	const lastMessage = messagesPage.data[0];
	const text = messageToText(lastMessage);
	await insertRequestPortMessage({
		requestId: args.requestId,
		requestDbId: args.requestDbId,
		portId: args.resultPort.id,
		message: text,
	});
};
