import { Webhooks } from "@octokit/webhooks";

const webhookSecret = process.env.GITHUB_APP_WEBHOOK_SECRET;
if (!webhookSecret) {
	throw new Error("GITHUB_WEBHOOK_SECRET is empty");
}
const webhooks = new Webhooks({
	secret: webhookSecret,
});

export { webhooks };
