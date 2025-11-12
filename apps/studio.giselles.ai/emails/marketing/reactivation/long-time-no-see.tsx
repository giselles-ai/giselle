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

interface LongTimeNoSeeEmailProps {
	userName?: string;
	returnUrl?: string;
}

export const LongTimeNoSeeEmail = ({
	userName = "there",
	returnUrl = "https://studio.giselles.ai",
}: LongTimeNoSeeEmailProps) => {
	const baseUrl = getBaseUrl();
	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>We've missed you at Giselle 💫</Preview>
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
							A lot has changed since your last visit, {userName} — new models,
							new features, and faster deployments.
						</Text>
						<Text style={text}>
							Come see what&apos;s new and continue building.
						</Text>
						<Button href={returnUrl} style={button}>
							Return to Giselle
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

LongTimeNoSeeEmail.PreviewProps = {
	userName: "John",
	returnUrl: "https://studio.giselles.ai",
} as LongTimeNoSeeEmailProps;

export default LongTimeNoSeeEmail;
