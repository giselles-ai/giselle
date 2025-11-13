import {
	Body,
	Button,
	Container,
	Head,
	Hr,
	Html,
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
	main,
	section,
	text,
	topBorder,
	topBorderSection,
} from "../components";

interface MagicLinkEmailProps {
	confirmationUrl?: string;
}

const SUPABASE_CONFIRMATION_URL_PLACEHOLDER = "{{ .ConfirmationURL }}";

export const MagicLinkEmail = ({ confirmationUrl }: MagicLinkEmailProps) => {
	const displayConfirmationUrl =
		confirmationUrl ?? SUPABASE_CONFIRMATION_URL_PLACEHOLDER;
	const baseUrl = getBaseUrl();

	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>Magic Link</Preview>
			<Body style={main}>
				<Container style={container}>
					<EmailHeader
						heading="Sign in to Giselle."
						subheading="Access your workspace instantly."
						baseUrl={baseUrl}
					/>
					<Section style={topBorderSection}>
						<Hr style={topBorder} />
					</Section>
					<Section style={section}>
						<Text style={{ ...h1, marginBottom: "16px" }}>Magic Link</Text>
						<Text style={text}>Follow this link to login:</Text>
						<Button href={displayConfirmationUrl} style={button}>
							Log In
						</Button>
						<Text style={text}>
							If you didn&apos;t request this login link, you can safely ignore
							this email.
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

MagicLinkEmail.PreviewProps = {
	confirmationUrl: "https://example.com/confirm",
} as MagicLinkEmailProps;

export default MagicLinkEmail;
