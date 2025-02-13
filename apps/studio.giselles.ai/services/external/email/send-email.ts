import nodemailer from "nodemailer";
import invariant from "tiny-invariant";
import { EmailConfigurationError, EmailSendError } from "./errors";
import type { EmailRecipient } from "./types";

function createTransport() {
	try {
		invariant(process.env.SMTP_HOST, "SMTP_HOST is not set");
		invariant(process.env.SMTP_PORT, "SMTP_PORT is not set");
		invariant(process.env.SMTP_SECURE, "SMTP_SECURE is not set");
		invariant(process.env.SMTP_USER, "SMTP_USER is not set");
		invariant(process.env.SMTP_PASS, "SMTP_PASS is not set");

		return nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			port: Number.parseInt(process.env.SMTP_PORT, 10),
			secure: process.env.SMTP_SECURE === "true",
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASS,
			},
		});
	} catch (error) {
		throw new EmailConfigurationError(
			`Invalid email configuration: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

export async function sendEmail(
	subject: string,
	body: string,
	recipients: EmailRecipient[],
): Promise<void> {
	if (recipients.length === 0) {
		throw new EmailSendError("No recipients found");
	}
	const to = recipients
		.map((r) => `${r.userDisplayName} <${r.userEmail}>`)
		.join(", ");

	if (process.env.SEND_EMAIL_DEBUG === "1") {
		console.log("========= Email Debug Mode =========");
		console.log("To:", to);
		console.log("Subject:", subject);
		console.log("Body:", body);
		console.log("==================================");
		return;
	}

	const transporter = createTransport();
	try {
		invariant(process.env.SMTP_FROM, "SMTP_FROM is not set");
		const from = `${process.env.SMTP_FROM_NAME ?? ""} <${process.env.SMTP_FROM}>`;
		await transporter.sendMail({
			from,
			to,
			subject,
			text: body,
		});
	} catch (error) {
		throw new EmailSendError(
			"Failed to send email",
			error instanceof Error ? error : undefined,
		);
	}
}
