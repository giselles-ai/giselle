import {
	Body,
	Button,
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

interface ChangelogAnnouncementEmailProps {
	userName?: string;
	screenshotUrl?: string;
	viewChangelogUrl?: string;
}

export const ChangelogAnnouncementEmail = ({
	userName = "there",
	screenshotUrl,
	viewChangelogUrl = "https://giselles.ai/changelog",
}: ChangelogAnnouncementEmailProps) => {
	const baseUrl = getBaseUrl();
	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>Giselle update</Preview>
			<Body style={main}>
				<Container style={container}>
					<EmailHeader
						heading="Giselle update"
						subheading="Building better — one release at a time."
						baseUrl={baseUrl}
					/>
					<Section style={topBorderSection}>
						<Hr style={topBorder} />
					</Section>
					<Section style={section}>
						<Text style={text}>
							Hi {userName},
						</Text>
						<Text style={text}>
							We&apos;ve just shipped a new round of improvements and fixes
							across Giselle Studio:
						</Text>
						<Text style={text}>
							• Faster agent deployment and improved queue management
							<br />
							• Enhanced model connection stability
							<br />
							• UI polish in Node Builder (dark mode + better tooltips)
						</Text>
						{screenshotUrl && (
							<Section style={imageSection}>
								<Img
									src={screenshotUrl}
									width="600"
									alt="Giselle Studio updates"
									style={image}
								/>
							</Section>
						)}
						<Text style={text}>
							Read the full changelog →{" "}
							<Link href={viewChangelogUrl} style={link}>
								View Updates
							</Link>
						</Text>
						<Text style={text}>
							As always, your feedback helps us refine Giselle.
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

ChangelogAnnouncementEmail.PreviewProps = {
	userName: "John",
	screenshotUrl: undefined,
	viewChangelogUrl: "https://giselles.ai/changelog",
} as ChangelogAnnouncementEmailProps;

const imageSection = {
	padding: "0",
	margin: "24px 0",
};

const image = {
	width: "100%",
	maxWidth: "600px",
	display: "block",
	margin: "0 auto",
};

export default ChangelogAnnouncementEmail;
