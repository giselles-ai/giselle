import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Img,
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
	getBaseUrl,
} from "../../components";

interface ThankYouForBuildingEmailProps {
	continueBuildingUrl?: string;
}

export const ThankYouForBuildingEmail = ({
	continueBuildingUrl = "https://studio.giselles.ai",
}: ThankYouForBuildingEmailProps) => {
	const baseUrl = getBaseUrl();
	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>Thank you for building with Giselle</Preview>
			<Body style={main}>
				<Container style={container}>
					<EmailHeader baseUrl={baseUrl} />
					<Section style={imageSection}>
						<Img
							src={`${baseUrl}/static/thank-you-for-building-1.jpg`}
							width="600"
							alt="Thank you for building"
							style={image}
						/>
					</Section>
					<Section style={section}>
						<Heading style={h1}>
							Thank You for Building with Giselle.
						</Heading>
						<Text style={text}>
							Every workflow, every experiment, every deployment — they all move
							us forward.
						</Text>
						<Text style={text}>
							Your creativity shapes the way AI gets built.
						</Text>
						<Text style={text}>
							Here&apos;s to you, and to what comes next.
						</Text>
						<Button href={continueBuildingUrl} style={button}>
							Continue Building →
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

ThankYouForBuildingEmail.PreviewProps = {
	continueBuildingUrl: "https://studio.giselles.ai",
} as ThankYouForBuildingEmailProps;

const imageSection = {
	padding: "0",
	margin: "0",
};

const image = {
	width: "100%",
	maxWidth: "600px",
	display: "block",
	margin: "0 auto",
};

export default ThankYouForBuildingEmail;
