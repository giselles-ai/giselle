import {
	Body,
	Container,
	Head,
	Hr,
	Html,
	Img,
	Link,
	Preview,
	Section,
	Text,
} from "@react-email/components";
import {
	container,
	EmailFonts,
	EmailFooter,
	getBaseUrl,
	link,
	main,
	section,
	signatureText,
	text,
	topBorder,
	topBorderSection,
} from "../../components";

interface ReleaseNotesDigestEmailProps {
	userName?: string;
	viewReleaseNotesUrl?: string;
}

export const ReleaseNotesDigestEmail = ({
	userName = "there",
	viewReleaseNotesUrl = "https://giselles.ai/changelog",
}: ReleaseNotesDigestEmailProps) => {
	const baseUrl = getBaseUrl();
	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>Release Notes Digest</Preview>
			<Body style={main}>
				<Container style={container}>
					<Section style={imageSection}>
						<Img
							src={`${baseUrl}/static/digest-202512.jpg`}
							width="600"
							alt="Release Notes Digest"
							style={image}
						/>
					</Section>
					<Section style={section}>
						<Text style={text}>Hi {userName},</Text>
						<Text style={text}>
							We&apos;ve wrapped up the year with a few exciting updates:
						</Text>
						<Text style={text}>
							✨ New Features
							<br />• Model Switching in Node Builder
							<br />• Stage Performance Boosts (2× faster rendering)
						</Text>
						<Text style={text}>
							⚙️ Improvements
							<br />• Simplified team access controls
							<br />• Cleaner workspace navigation
						</Text>
						<Text style={text}>
							📘 Highlights
							<br />• Watch: &quot;Designing Flows That Think&quot; (Webinar
							Replay)
							<br />• Read: Top 5 Agent Templates of 2025
						</Text>
						<Text style={text}>
							<Link href={viewReleaseNotesUrl} style={link}>
								View Full Release Notes
							</Link>
						</Text>
						<Text style={text}>
							Stay inspired and keep building — your agents are ready for 2026.
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
				<EmailFooter baseUrl={baseUrl} />
			</Body>
		</Html>
	);
};

ReleaseNotesDigestEmail.PreviewProps = {
	userName: "John",
	viewReleaseNotesUrl: "https://giselles.ai/changelog",
} as ReleaseNotesDigestEmailProps;

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

export default ReleaseNotesDigestEmail;
