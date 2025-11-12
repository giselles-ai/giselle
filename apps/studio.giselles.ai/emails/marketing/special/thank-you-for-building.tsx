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

interface ThankYouForBuildingEmailProps {
	userName?: string;
	continueBuildingUrl?: string;
}

export const ThankYouForBuildingEmail = ({
	userName = "there",
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
					<EmailHeader
						heading="A year of creation."
						subheading="Thank you for building with us."
						baseUrl={baseUrl}
					/>
					<Section style={topBorderSection}>
						<Hr style={topBorder} />
					</Section>
					<Section style={section}>
						<Text style={text}>
							Thank you, {userName}, for being part of the Giselle community.
						</Text>
						<Text style={text}>
							Your creativity and dedication inspire us every day. We&apos;re
							grateful for builders like you who push the boundaries of what&apos;s
							possible with AI agents.
						</Text>
						<Button href={continueBuildingUrl} style={button}>
							Continue Building
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
	userName: "John",
	continueBuildingUrl: "https://studio.giselles.ai",
} as ThankYouForBuildingEmailProps;

export default ThankYouForBuildingEmail;
