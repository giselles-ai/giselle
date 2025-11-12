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

interface CommunityNewsletterEmailProps {
	userName?: string;
	viewCommunityUrl?: string;
}

export const CommunityNewsletterEmail = ({
	userName = "there",
	viewCommunityUrl = "https://giselles.ai/community",
}: CommunityNewsletterEmailProps) => {
	const baseUrl = getBaseUrl();
	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>Join the Giselle community</Preview>
			<Body style={main}>
				<Container style={container}>
					<EmailHeader
						heading="Let's grow together."
						subheading="Become a Giselle Ambassador."
						baseUrl={baseUrl}
					/>
					<Section style={topBorderSection}>
						<Hr style={topBorder} />
					</Section>
					<Section style={section}>
						<Text style={text}>
							Hi {userName}, join thousands of builders in the Giselle
							community.
						</Text>
						<Text style={text}>
							Share your workflows, get inspired by others, and connect with
							fellow AI agent creators.
						</Text>
						<Button href={viewCommunityUrl} style={button}>
							Join Community
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

CommunityNewsletterEmail.PreviewProps = {
	userName: "John",
	viewCommunityUrl: "https://giselles.ai/community",
} as CommunityNewsletterEmailProps;

export default CommunityNewsletterEmail;
