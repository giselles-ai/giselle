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

interface AmbassadorInviteEmailProps {
	userName?: string;
	applyUrl?: string;
}

export const AmbassadorInviteEmail = ({
	userName = "there",
	applyUrl = "https://giselles.ai/ambassador",
}: AmbassadorInviteEmailProps) => {
	const baseUrl = getBaseUrl();
	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>Join the Giselle Ambassador Program 🪶</Preview>
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
							We&apos;re inviting creators and developers like you, {userName},
							to join our early ambassador program.
						</Text>
						<Text style={text}>
							Share your workflows, build templates, and shape the next
							generation of AI builders.
						</Text>
						<Button href={applyUrl} style={button}>
							Apply Now
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

AmbassadorInviteEmail.PreviewProps = {
	userName: "John",
	applyUrl: "https://giselles.ai/ambassador",
} as AmbassadorInviteEmailProps;

export default AmbassadorInviteEmail;
