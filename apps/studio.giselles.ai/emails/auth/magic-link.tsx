import { Body, Head, Html, Preview } from "@react-email/components";

interface MagicLinkEmailProps {
	confirmationUrl?: string;
}

const SUPABASE_CONFIRMATION_URL_PLACEHOLDER = "{{ .ConfirmationURL }}";

export const MagicLinkEmail = ({ confirmationUrl }: MagicLinkEmailProps) => {
	const displayConfirmationUrl =
		confirmationUrl ?? SUPABASE_CONFIRMATION_URL_PLACEHOLDER;

	return (
		<Html>
			<Head />
			<Preview>Magic Link</Preview>
			<Body>
				<h2>Magic Link</h2>
				<p>Follow this link to login:</p>
				<p>
					<a href={displayConfirmationUrl}>Log In</a>
				</p>
			</Body>
		</Html>
	);
};

MagicLinkEmail.PreviewProps = {
	confirmationUrl: "https://example.com/magic/123",
} as MagicLinkEmailProps;

export default MagicLinkEmail;
