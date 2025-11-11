import { Body, Head, Html, Preview } from "@react-email/components";

interface ChangeEmailAddressEmailProps {
	email?: string;
	newEmail?: string;
	confirmationUrl?: string;
}

const SUPABASE_EMAIL_PLACEHOLDER = "{{ .Email }}";
const SUPABASE_NEW_EMAIL_PLACEHOLDER = "{{ .NewEmail }}";
const SUPABASE_CONFIRMATION_URL_PLACEHOLDER = "{{ .ConfirmationURL }}";

export const ChangeEmailAddressEmail = ({
	email,
	newEmail,
	confirmationUrl,
}: ChangeEmailAddressEmailProps) => {
	const displayEmail = email ?? SUPABASE_EMAIL_PLACEHOLDER;
	const displayNewEmail = newEmail ?? SUPABASE_NEW_EMAIL_PLACEHOLDER;
	const displayConfirmationUrl =
		confirmationUrl ?? SUPABASE_CONFIRMATION_URL_PLACEHOLDER;

	return (
		<Html>
			<Head />
			<Preview>Confirm Change of Email</Preview>
			<Body>
				<h2>Confirm Change of Email</h2>
				<p>
					Follow this link to confirm the update of your email from{" "}
					{displayEmail} to {displayNewEmail}:
				</p>
				<p>
					<a href={displayConfirmationUrl}>Change Email</a>
				</p>
			</Body>
		</Html>
	);
};

ChangeEmailAddressEmail.PreviewProps = {
	email: "current@example.com",
	newEmail: "new@example.com",
	confirmationUrl: "https://example.com/change-email/123",
} as ChangeEmailAddressEmailProps;

export default ChangeEmailAddressEmail;
