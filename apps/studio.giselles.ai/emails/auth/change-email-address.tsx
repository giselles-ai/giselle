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
	EmailFonts,
	EmailHeader,
	EmailFooter,
	main,
	container,
	topBorderSection,
	topBorder,
	section,
	text,
	button,
	h1,
	signatureText,
	link,
	getBaseUrl,
} from "../components";

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
	const baseUrl = getBaseUrl();

	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>Confirm Change of Email</Preview>
			<Body style={main}>
				<Container style={container}>
					<EmailHeader baseUrl={baseUrl} />
					<Section style={topBorderSection}>
						<Hr style={topBorder} />
					</Section>
					<Section style={section}>
						<Text style={{ ...h1, marginBottom: "16px" }}>
							Confirm Change of Email
						</Text>
						<Text style={text}>
							Follow this link to confirm the update of your email from{" "}
							<strong>{displayEmail}</strong> to{" "}
							<strong>{displayNewEmail}</strong>:
						</Text>
						<Button href={displayConfirmationUrl} style={button}>
							Change Email
						</Button>
						<Text style={text}>
							If you didn&apos;t request this change, you can safely ignore this
							email.
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

ChangeEmailAddressEmail.PreviewProps = {
	email: "old@example.com",
	newEmail: "new@example.com",
	confirmationUrl: "https://example.com/confirm",
} as ChangeEmailAddressEmailProps;

export default ChangeEmailAddressEmail;
