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

interface WelcomeSeries2FeaturesEmailProps {
	userName?: string;
	exploreDocsUrl?: string;
}

export const WelcomeSeries2FeaturesEmail = ({
	userName = "there",
	exploreDocsUrl = "https://docs.giselles.ai",
}: WelcomeSeries2FeaturesEmailProps) => {
	const baseUrl = getBaseUrl();
	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>Discover what Giselle can do for you</Preview>
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
							Hi {userName}, let&apos;s explore what makes Giselle powerful.
						</Text>
						<Text style={text}>
							From multi-model orchestration to workflow automation, discover
							how to build agents that work for you.
						</Text>
						<Button href={exploreDocsUrl} style={button}>
							Explore Docs
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

WelcomeSeries2FeaturesEmail.PreviewProps = {
	userName: "John",
	exploreDocsUrl: "https://docs.giselles.ai",
} as WelcomeSeries2FeaturesEmailProps;

export default WelcomeSeries2FeaturesEmail;

