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
	h1,
	link,
	main,
	section,
	signatureText,
	text,
	topBorder,
	topBorderSection,
} from "../components";

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
	const baseUrl = getBaseUrl();

	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>You have been invited</Preview>
			<Body style={main}>
				<Container style={container}>
					<EmailHeader
						heading="Welcome to Giselle."
						subheading="Your journey to build AI agents begins here."
						baseUrl={baseUrl}
					/>
					<Section style={topBorderSection}>
						<Hr style={topBorder} />
					</Section>
					<Section style={section}>
						<Text style={{ ...h1, marginBottom: "16px" }}>
							You have been invited
						</Text>
						<Text style={text}>
							You have been invited to create a user on{" "}
							<strong>{displaySiteUrl}</strong>. Follow this link to accept the
							invite:
						</Text>
						<Button href={displayConfirmationUrl} style={button}>
							Accept the invite
						</Button>
						<Text style={text}>
							If you didn&apos;t expect this invitation, you can safely ignore
							this email.
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

YouHaveBeenInvitedEmail.PreviewProps = {
	siteUrl: "https://studio.giselles.ai",
	confirmationUrl: "https://example.com/confirm",
} as YouHaveBeenInvitedEmailProps;

export default YouHaveBeenInvitedEmail;
