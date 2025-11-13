import {
	Body,
	Button,
	Container,
	Head,
	Hr,
	Html,
	Link,
	Preview,
	Section,
	Text,
} from "@react-email/components";
import {
	button,
	container,
	EmailFonts,
	EmailFooter,
	EmailHeader,
	getBaseUrl,
	link,
	main,
	section,
	signatureText,
	text,
	topBorder,
	topBorderSection,
} from "../components";

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
	const baseUrl = getBaseUrl();

	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>Reset your Giselle password</Preview>
			<Body style={main}>
				<Container style={container}>
					<EmailHeader
						heading="Reset your Giselle password."
						subheading="Your journey continues securely."
						baseUrl={baseUrl}
					/>
					<Section style={topBorderSection}>
						<Hr style={topBorder} />
					</Section>
					<Section style={section}>
						<Text style={text}>
							We received a request to reset your Giselle account password.
						</Text>
						<Text style={text}>
							Click the button below to complete your password reset. The link
							will expire in 1 hour.
						</Text>
						<Button href={resetUrl} style={button}>
							Reset Password
						</Button>
						<Text style={text}>
							If you didn&apos;t ask to reset your password, please ignore this
							message.
						</Text>
						<Text style={signatureText}>
							—<br />
							The Giselle Team
							<br />
							<Link href="https://giselles.ai" style={link}>
								https://giselles.ai
							</Link>
						</Text>
					</Section>
					<Section style={topBorderSection}>
						<Hr style={topBorder} />
					</Section>
				</Container>
				<EmailFooter baseUrl={baseUrl} />
			</Body>
		</Html>
	);
};

ResetPasswordEmail.PreviewProps = {
	siteUrl: "https://studio.giselles.ai",
	tokenHash: "example-token-hash",
} as ResetPasswordEmailProps;

export default ResetPasswordEmail;
