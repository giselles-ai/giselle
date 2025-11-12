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

interface TrialEndingReminderEmailProps {
	userName?: string;
	daysRemaining?: number;
	upgradeUrl?: string;
}

export const TrialEndingReminderEmail = ({
	userName = "there",
	daysRemaining = 3,
	upgradeUrl = "https://studio.giselles.ai/upgrade",
}: TrialEndingReminderEmailProps) => {
	const baseUrl = getBaseUrl();
	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>Your trial ends in {daysRemaining} days</Preview>
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
							Hi {userName}, your trial period ends in {daysRemaining} day
							{daysRemaining !== 1 ? "s" : ""}.
						</Text>
						<Text style={text}>
							Continue building with Giselle and unlock unlimited agents,
							advanced features, and priority support.
						</Text>
						<Button href={upgradeUrl} style={button}>
							Upgrade Now
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

TrialEndingReminderEmail.PreviewProps = {
	userName: "John",
	daysRemaining: 3,
	upgradeUrl: "https://studio.giselles.ai/upgrade",
} as TrialEndingReminderEmailProps;

export default TrialEndingReminderEmail;
