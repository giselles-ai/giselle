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

interface WebinarInvitationEmailProps {
	userName?: string;
	webinarTitle?: string;
	webinarDate?: string;
	joinUrl?: string;
}

export const WebinarInvitationEmail = ({
	userName = "there",
	webinarTitle = "Building AI Agents with Giselle",
	webinarDate = "January 15, 2025 at 2:00 PM EST",
	joinUrl = "https://giselles.ai/webinar",
}: WebinarInvitationEmailProps) => {
	const baseUrl = getBaseUrl();
	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>Join us for {webinarTitle}</Preview>
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
							Hi {userName}, we&apos;re hosting a webinar: &quot;
							{webinarTitle}&quot;
						</Text>
						<Text style={text}>Date: {webinarDate}</Text>
						<Text style={text}>
							Learn how to build powerful AI agents and get your questions
							answered by our team.
						</Text>
						<Button href={joinUrl} style={button}>
							Join Event
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

WebinarInvitationEmail.PreviewProps = {
	userName: "John",
	webinarTitle: "Building AI Agents with Giselle",
	webinarDate: "January 15, 2025 at 2:00 PM EST",
	joinUrl: "https://giselles.ai/webinar",
} as WebinarInvitationEmailProps;

export default WebinarInvitationEmail;
