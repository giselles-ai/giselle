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
	button,
	container,
	EmailFonts,
	EmailFooter,
	EmailHeader,
	getBaseUrl,
	link,
	main,
	section,
	signatureText,
	text,
	topBorder,
	topBorderSection,
} from "../../components";

interface WebinarInvitationEmailProps {
	userName?: string;
	webinarDate?: string;
	webinarTime?: string;
	joinUrl?: string;
}

export const WebinarInvitationEmail = ({
	userName = "there",
	webinarDate = "January 15, 2025",
	webinarTime = "2:00 PM EST",
	joinUrl = "https://giselles.ai/webinar",
}: WebinarInvitationEmailProps) => {
	const baseUrl = getBaseUrl();
	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>Join us for Building AI Agents with Giselle</Preview>
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
						<Text style={text}>Hi {userName},</Text>
						<Text style={text}>
							We&apos;re hosting a live webinar: &quot;Building AI Agents with
							Giselle.&quot;
						</Text>
						<Text style={text}>
							🗓️ Date: {webinarDate}
							<br />⏰ Time: {webinarTime}
						</Text>
						<Text style={text}>
							Learn how to design, deploy, and scale AI agents — and get your
							questions answered directly by our team.
						</Text>
						<Button href={joinUrl} style={button}>
							Join Event
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

WebinarInvitationEmail.PreviewProps = {
	userName: "John",
	webinarDate: "January 15, 2025",
	webinarTime: "2:00 PM EST",
	joinUrl: "https://giselles.ai/webinar",
} as WebinarInvitationEmailProps;

export default WebinarInvitationEmail;
