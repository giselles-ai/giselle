import {
	Body,
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
	h1,
	codeContainer,
	code,
	footerText,
	signatureText,
	link,
	getBaseUrl,
} from "../components";

interface ConfirmSignUpEmailProps {
	token?: string;
}

const SUPABASE_TOKEN_PLACEHOLDER = "{{ .Token }}";

export const ConfirmSignUpEmail = ({ token }: ConfirmSignUpEmailProps) => {
	const displayToken = token ?? SUPABASE_TOKEN_PLACEHOLDER;
	const baseUrl = getBaseUrl();
	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>Verification code for Giselle</Preview>
			<Body style={main}>
				<Container style={container}>
					<EmailHeader
						heading="Verify your email."
						subheading="Your workspace is almost ready."
						baseUrl={baseUrl}
					/>
					<Section style={topBorderSection}>
						<Hr style={topBorder} />
					</Section>
					<Section style={section}>
						<Text style={{ ...h1, marginBottom: "16px" }}>
							You&apos;re almost in!
						</Text>
						<Text style={text}>Your verification code is:</Text>
						<Section style={codeContainer}>
							<Text style={code}>{displayToken}</Text>
						</Section>
						<Text style={text}>
							Enter it to verify your email and begin your journey with Giselle.
						</Text>
						<Text style={footerText}>This code will expire in 1 hour.</Text>
						<Text style={footerText}>
							If you didn&apos;t request this code, you can safely ignore this
							email.
						</Text>
						<Text style={footerText}>
							Need a hand?{" "}
							<Link href="mailto:support@giselles.ai" style={link}>
								support@giselles.ai
							</Link>
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

ConfirmSignUpEmail.PreviewProps = {
	token: "123456",
} as ConfirmSignUpEmailProps;

export default ConfirmSignUpEmail;
