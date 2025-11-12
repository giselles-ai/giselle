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

interface WelcomeSeries1IntroEmailProps {
	userName?: string;
	getStartedUrl?: string;
}

export const WelcomeSeries1IntroEmail = ({
	userName = "there",
	getStartedUrl = "https://studio.giselles.ai",
}: WelcomeSeries1IntroEmailProps) => {
	const baseUrl = getBaseUrl();
	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>Welcome to Giselle — where ideas become agents.</Preview>
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
						<Text style={text}>
							We&apos;re thrilled to have you on board, {userName}.
						</Text>
						<Text style={text}>
							Start by creating your first workspace — it only takes a few
							minutes.
						</Text>
						<Button href={getStartedUrl} style={button}>
							Get Started
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

WelcomeSeries1IntroEmail.PreviewProps = {
	userName: "John",
	getStartedUrl: "https://studio.giselles.ai",
} as WelcomeSeries1IntroEmailProps;

export default WelcomeSeries1IntroEmail;
