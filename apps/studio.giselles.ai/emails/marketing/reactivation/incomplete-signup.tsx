import {
	Body,
	Button,
	Container,
	Head,
	Heading,
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
} from "../../components";

interface IncompleteSignupEmailProps {
	userName?: string;
	completeSignupUrl?: string;
	resendCodeUrl?: string;
}

export const IncompleteSignupEmail = ({
	userName = "there",
	completeSignupUrl = "https://studio.giselles.ai/signup/verify-email",
	resendCodeUrl = "https://studio.giselles.ai/signup/verify-email",
}: IncompleteSignupEmailProps) => {
	const baseUrl = getBaseUrl();
	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>Complete your Giselle signup</Preview>
			<Body style={main}>
				<Container style={container}>
					<EmailHeader
						heading="It's been a while."
						subheading="Your agents are waiting for you."
						baseUrl={baseUrl}
					/>
					<Section style={topBorderSection}>
						<Hr style={topBorder} />
					</Section>
					<Section style={section}>
						<Heading style={h1}>Verify your email.</Heading>
						<Text style={text}>
							Hi {userName}, we noticed you started signing up for Giselle but
							didn&apos;t finish verifying your email.
						</Text>
						<Text style={text}>
							Complete your signup by verifying your email address. Enter the
							verification code we sent, or request a new one if you need it.
						</Text>
						<Button href={completeSignupUrl} style={button}>
							Verify your email
						</Button>
						<Text style={text}>
							Didn&apos;t receive a code?{" "}
							<Link href={resendCodeUrl} style={link}>
								Request a new verification code
							</Link>
							.
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

IncompleteSignupEmail.PreviewProps = {
	userName: "John",
	completeSignupUrl: "https://studio.giselles.ai/signup/verify-email",
	resendCodeUrl: "https://studio.giselles.ai/signup/verify-email",
} as IncompleteSignupEmailProps;

export default IncompleteSignupEmail;
