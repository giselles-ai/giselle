import { Body, Head, Html, Preview } from "@react-email/components";

interface YouHaveBeenInvitedEmailProps {
	siteUrl?: string;
	confirmationUrl?: string;
}

const SUPABASE_SITE_URL_PLACEHOLDER = "{{ .SiteURL }}";
const SUPABASE_CONFIRMATION_URL_PLACEHOLDER = "{{ .ConfirmationURL }}";

export const YouHaveBeenInvitedEmail = ({
	siteUrl,
	confirmationUrl,
}: YouHaveBeenInvitedEmailProps) => {
	const displaySiteUrl = siteUrl ?? SUPABASE_SITE_URL_PLACEHOLDER;
	const displayConfirmationUrl =
		confirmationUrl ?? SUPABASE_CONFIRMATION_URL_PLACEHOLDER;

	return (
		<Html>
			<Head />
			<Preview>You have been invited</Preview>
			<Body>
				<h2>You have been invited</h2>
				<p>
					You have been invited to create a user on {displaySiteUrl}. Follow
					this link to accept the invite:
				</p>
				<p>
					<a href={displayConfirmationUrl}>Accept the invite</a>
				</p>
			</Body>
		</Html>
	);
};

YouHaveBeenInvitedEmail.PreviewProps = {
	siteUrl: "https://example.com",
	confirmationUrl: "https://example.com/invite/123",
} as YouHaveBeenInvitedEmailProps;

export default YouHaveBeenInvitedEmail;
