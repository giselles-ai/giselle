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

interface NewFeatureReleaseEmailProps {
	featureName?: string;
	featureDescription?: string;
	viewUpdateUrl?: string;
}

export const NewFeatureReleaseEmail = ({
	featureName = "Gemini 2.5 Flash",
	featureDescription = "You can now integrate Gemini 2.5 Flash directly into your agent flows.",
	viewUpdateUrl = "https://studio.giselles.ai",
}: NewFeatureReleaseEmailProps) => {
	const baseUrl = getBaseUrl();
	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>Giselle now supports {featureName} 🚀</Preview>
			<Body style={main}>
				<Container style={container}>
					<EmailHeader
						heading="New in Giselle."
						subheading="Smarter, faster, and more connected than ever."
						baseUrl={baseUrl}
					/>
					<Section style={topBorderSection}>
						<Hr style={topBorder} />
					</Section>
					<Section style={section}>
						<Text style={text}>
							{featureDescription} Build multi-model orchestration with ease —
							no extra setup required.
						</Text>
						<Button href={viewUpdateUrl} style={button}>
							View Update
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

NewFeatureReleaseEmail.PreviewProps = {
	featureName: "Gemini 2.5 Flash",
	featureDescription:
		"You can now integrate Gemini 2.5 Flash directly into your agent flows.",
	viewUpdateUrl: "https://studio.giselles.ai",
} as NewFeatureReleaseEmailProps;

export default NewFeatureReleaseEmail;
