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
	getBaseUrl,
} from "../../components";

interface IncompleteSignupEmailProps {
	userName?: string;
	completeSignupUrl?: string;
}

export const IncompleteSignupEmail = ({
	userName = "there",
	completeSignupUrl = "https://studio.giselles.ai/signup",
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
						<Text style={text}>
							Hi {userName}, we noticed you started signing up for Giselle but
							didn&apos;t finish.
						</Text>
						<Text style={text}>
							Complete your signup in just a few clicks and start building AI
							agents today.
						</Text>
						<Button href={completeSignupUrl} style={button}>
							Complete Signup
						</Button>
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
	completeSignupUrl: "https://studio.giselles.ai/signup",
} as IncompleteSignupEmailProps;

export default IncompleteSignupEmail;
