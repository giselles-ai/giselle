import type { GenerationId } from "@giselle-sdk/giselle";
import { EventSchemas, Inngest } from "inngest";

type Events = {
	"giselle/generate-content": {
		data: {
			generationId: GenerationId;
		};
	};
};

// Create a client to send and receive events
export const inngest = new Inngest({
	id: "giselle-inngest",
	schemas: new EventSchemas().fromRecord<Events>(),
});
