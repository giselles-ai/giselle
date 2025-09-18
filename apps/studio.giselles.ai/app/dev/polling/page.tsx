"use client";
import { createUIMessageStream, readUIMessageStream, type UIMessage } from "ai";
import { useCallback, useEffect, useState } from "react";

export default function () {
	const [message, setMessage] = useState<UIMessage | undefined>();
	const processStream = useCallback(async () => {
		const stream = createUIMessageStream({
			async execute({ writer }) {
				for (const line of chunks) {
					writer.write(JSON.parse(line));
					await sleep(1000 * Math.random());
				}
			},
		});

		for await (const tmpMessage of readUIMessageStream({ stream })) {
			setMessage(tmpMessage);
		}
	}, []);

	useEffect(() => {
		processStream();
	}, [processStream]);

	if (message === undefined) {
		return null;
	}
	return (
		<div>
			{/*{message.parts.map((part, index) => (
				<UIMessagePartBlock part={part} key={index} />
			))}*/}

			{message.parts.map((part, index) => {
				switch (part.type) {
					case "text":
						return <div key={index}>{part.text}</div>;
					default:
						return null;
				}
			})}
		</div>
	);
}

// %% handmade stream
const chunks = [
	`{"type":"start"}`,
	`{"type":"start-step"}`,
	`{"type":"reasoning-start","id":"rs_0677bf538da0dc680068c8bf4072388191949d23cdef574afd:0","providerMetadata":{"openai":{"itemId":"rs_0677bf538da0dc680068c8bf4072388191949d23cdef574afd","reasoningEncryptedContent":null}}}`,
	`{"type":"reasoning-end","id":"rs_0677bf538da0dc680068c8bf4072388191949d23cdef574afd:0","providerMetadata":{"openai":{"itemId":"rs_0677bf538da0dc680068c8bf40723881919254a5f25ebb05e8","reasoningEncryptedContent":null}}}`,
	`{"type":"text-start","id":"msg_0677bf538da0dc680068c8bf40850081919254a5f25ebb05e8","providerMetadata":{"openai":{"itemId":"msg_0677bf538da0dc680068c8bf40850081919254a5f25ebb05e8"}}}`,
	`{"type":"text-delta","id":"msg_0677bf538da0dc680068c8bf40850081919254a5f25ebb05e8","delta":"Hello"}`,
	`{"type":"text-delta","id":"msg_0677bf538da0dc680068c8bf40850081919254a5f25ebb05e8","delta":"!"}`,
	`{"type":"text-delta","id":"msg_0677bf538da0dc680068c8bf40850081919254a5f25ebb05e8","delta":" How"}`,
	`{"type":"text-delta","id":"msg_0677bf538da0dc680068c8bf40850081919254a5f25ebb05e8","delta":" can"}`,
	`{"type":"text-delta","id":"msg_0677bf538da0dc680068c8bf40850081919254a5f25ebb05e8","delta":" I"}`,
	`{"type":"text-delta","id":"msg_0677bf538da0dc680068c8bf40850081919254a5f25ebb05e8","delta":" help"}`,
	`{"type":"text-delta","id":"msg_0677bf538da0dc680068c8bf40850081919254a5f25ebb05e8","delta":" you"}`,
	`{"type":"text-delta","id":"msg_0677bf538da0dc680068c8bf40850081919254a5f25ebb05e8","delta":" today"}`,
	`{"type":"text-delta","id":"msg_0677bf538da0dc680068c8bf40850081919254a5f25ebb05e8","delta":"?"}`,
	`{"type":"text-end","id":"msg_0677bf538da0dc680068c8bf40850081919254a5f25ebb05e8"}`,
	`{"type":"finish-step"}`,
	`{"type":"finish"}`,
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
