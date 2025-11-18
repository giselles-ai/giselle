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
	link,
	main,
	section,
	signatureText,
	text,
	topBorder,
	topBorderSection,
} from "../../components";

interface ReminderEmailProps {
	userName?: string;
	returnToGiselleUrl?: string;
	examplesGalleryUrl?: string;
	releaseNotesUrl?: string;
}

export const ReminderEmail = ({
	userName = "there",
	returnToGiselleUrl = "https://studio.giselles.ai",
	examplesGalleryUrl = "https://giselles.ai",
	releaseNotesUrl:
		_releaseNotesUrl = "https://docs.giselles.ai/en/releases/release-notes",
}: ReminderEmailProps) => {
	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>Your workspace is waiting 🌙</Preview>
			<Body style={main}>
				<Container style={container}>
					<EmailHeader
						heading="Your workspace is waiting."
						subheading="Create your first agent and start building."
					/>
					<Section style={topBorderSection}>
						<Hr style={topBorder} />
					</Section>
					<Section style={section}>
						<Text style={text}>
							Hi {userName},<br />
							<br />
							You started setting up Giselle but haven&apos;t created your first
							agent yet.
							<br />
							<br />
							Your workspace is ready — it only takes a few minutes to build
							your first agent. Try Stage to test agents instantly, or create
							your first workspace to start building visually.
							<br />
							<br />
							Pick up right where you left off and start creating.
						</Text>
						<Button href={returnToGiselleUrl} style={button}>
							Create your first agent
						</Button>
						<Text style={text}>
							Need help getting started? Check out our{" "}
							<Link href={examplesGalleryUrl} style={link}>
								examples gallery
							</Link>{" "}
							or reach out anytime at{" "}
							<Link href="mailto:support@giselles.ai" style={link}>
								support@giselles.ai
							</Link>
							.
						</Text>
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
				<EmailFooter />
			</Body>
		</Html>
	);
};

ReminderEmail.PreviewProps = {
	userName: "John",
	returnToGiselleUrl: "https://studio.giselles.ai",
	examplesGalleryUrl: "https://giselles.ai",
	releaseNotesUrl: "https://docs.giselles.ai/en/releases/release-notes",
} as ReminderEmailProps;

export default ReminderEmail;
