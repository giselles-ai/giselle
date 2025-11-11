import { Body, Head, Html, Preview } from "@react-email/components";

interface ResetPasswordEmailProps {
	siteUrl?: string;
	tokenHash?: string;
}

const SUPABASE_SITE_URL_PLACEHOLDER = "{{ .SiteURL }}";
const SUPABASE_TOKEN_HASH_PLACEHOLDER = "{{ .TokenHash }}";

export const ResetPasswordEmail = ({
	siteUrl,
	tokenHash,
}: ResetPasswordEmailProps) => {
	const displaySiteUrl = siteUrl ?? SUPABASE_SITE_URL_PLACEHOLDER;
	const displayTokenHash = tokenHash ?? SUPABASE_TOKEN_HASH_PLACEHOLDER;
	const resetUrl = `${displaySiteUrl}/password_reset/confirm?token_hash=${displayTokenHash}&type=recovery&next=/password_reset/new_password`;

	return (
		<Html>
			<Head />
			<Preview>Reset your Giselle password</Preview>
			<Body>
				<p>We received a request to reset your Giselle account password.</p>
				<p>
					Click the link below to complete your password reset. The link will
					expire in 1 hour. If you didn&apos;t ask to reset your password,
					please ignore this message.
				</p>
				<p>{resetUrl}</p>
			</Body>
		</Html>
	);
};

ResetPasswordEmail.PreviewProps = {
	siteUrl: "https://example.com",
	tokenHash: "token-hash-123",
} as ResetPasswordEmailProps;

export default ResetPasswordEmail;
