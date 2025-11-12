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
	signatureText,
	link,
	getBaseUrl,
} from "../../components";

interface FeatureHighlightsEmailProps {
	exploreFeaturesUrl?: string;
}

export const FeatureHighlightsEmail = ({
	exploreFeaturesUrl = "https://giselles.ai/features",
}: FeatureHighlightsEmailProps) => {
	const baseUrl = getBaseUrl();
	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>What you can build with Giselle 💡</Preview>
			<Body style={main}>
				<Container style={container}>
					<EmailHeader
						heading="From idea to orchestration."
						subheading="Here&apos;s what&apos;s possible."
						baseUrl={baseUrl}
					/>
					<Section style={topBorderSection}>
						<Hr style={topBorder} />
					</Section>
					<Section style={section}>
						<Text style={text}>
							Explore how teams are building dashboards, internal tools, and
							agents with Giselle&apos;s visual node builder.
						</Text>
						<Text style={text}>
							Connect GPT-5, Claude, Gemini — and orchestrate them seamlessly.
						</Text>
						<Button href={exploreFeaturesUrl} style={button}>
							Explore features
						</Button>
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

FeatureHighlightsEmail.PreviewProps = {
	exploreFeaturesUrl: "https://giselles.ai/features",
} as FeatureHighlightsEmailProps;

export default FeatureHighlightsEmail;

