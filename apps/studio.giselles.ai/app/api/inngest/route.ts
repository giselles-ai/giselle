import { serve } from "inngest/next";
import { generateContent, inngest } from "../../../lib/inngest";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
	client: inngest,
	functions: [generateContent],
});
