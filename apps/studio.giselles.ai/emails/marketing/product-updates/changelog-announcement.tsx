import {
	Body,
	Column,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Link,
	Preview,
	Row,
	Section,
	Text,
} from "@react-email/components";
import {
	container,
	EmailFonts,
	EmailFooter,
	EmailHeader,
	getEmailAssetUrl,
	link,
	main,
	section,
	signatureText,
	text,
	topBorder,
	topBorderSection,
} from "../../components";

interface ChangelogAnnouncementEmailProps {
	userName?: string;
	date?: string;
	screenshotUrl?: string;
	viewChangelogUrl?: string;
}

export const ChangelogAnnouncementEmail = ({
	userName: _userName = "there",
	date = new Date().toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
	}),
	screenshotUrl,
	viewChangelogUrl = "https://giselles.ai/changelog",
}: ChangelogAnnouncementEmailProps) => {
	const headerBannerSrc = getEmailAssetUrl("giselletimes.png");
	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>Giselle update</Preview>
			<Body style={main}>
				<Container style={container}>
					<EmailHeader />
					<Section style={headerBannerSection}>
						<Img
							src={headerBannerSrc}
							width="300"
							alt="Giselle Times"
							style={headerBannerImage}
						/>
					</Section>
					<Section style={topBorderSection}>
						<Hr style={thickBlackBorder} />
						<Hr style={thinBlackBorder} />
					</Section>
					<Section style={titleSection}>
						<Row>
							<Column style={titleLeftColumn}>
								<Text style={copyrightText}>©️2025 Giselle</Text>
							</Column>
							<Column style={titleCenterColumn}>
								<Heading style={titleText}>Product Update</Heading>
							</Column>
							<Column style={titleRightColumn}>
								<Text style={dateText}>{date}</Text>
							</Column>
						</Row>
					</Section>
					<Section style={topBorderSection}>
						<Hr style={thinBlackBorder} />
					</Section>
					<Section style={section}>
						<Heading style={articleHeading}>
							Performance Up, Latency Down.
						</Heading>
						<Text style={articleSubheading}>
							This week&apos;s rollout brings a faster, cleaner, more stable
							Giselle Studio.
						</Text>
						<Hr style={articleDivider} />
						<Text style={text}>
							We&apos;ve just shipped a new round of improvements and fixes
							across Giselle Studio:
						</Text>
						<Text style={text}>
							• Faster agent deployment and improved queue management
							<br />• Enhanced model connection stability
							<br />• UI polish in Node Builder (dark mode + better tooltips)
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
				<EmailFooter />
			</Body>
		</Html>
	);
};

ChangelogAnnouncementEmail.PreviewProps = {
	userName: "John",
	date: "December 15, 2025",
	screenshotUrl: undefined,
	viewChangelogUrl: "https://giselles.ai/changelog",
} as ChangelogAnnouncementEmailProps;

const headerBannerSection = {
	backgroundColor: "#ffffff",
	padding: "32px 48px 0 48px",
};

const _leftColumn = {
	width: "150px",
	verticalAlign: "middle" as const,
};

const _centerColumn = {
	width: "300px",
	verticalAlign: "middle" as const,
	textAlign: "center" as const,
};

const _rightColumn = {
	width: "150px",
	verticalAlign: "middle" as const,
	textAlign: "right" as const,
};

const headerBannerImage = {
	display: "block",
	margin: "0 auto",
};

const dateText = {
	color: "#333",
	fontSize: "14px",
	fontWeight: "400",
	margin: "0",
	padding: "0",
	lineHeight: "20px",
	fontFamily:
		'"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
	textAlign: "right" as const,
};

const titleSection = {
	backgroundColor: "#ffffff",
	padding: "8px 48px",
};

const titleLeftColumn = {
	width: "150px",
	verticalAlign: "middle" as const,
	textAlign: "left" as const,
};

const titleCenterColumn = {
	width: "300px",
	verticalAlign: "middle" as const,
	textAlign: "center" as const,
};

const titleRightColumn = {
	width: "150px",
	verticalAlign: "middle" as const,
	textAlign: "right" as const,
};

const copyrightText = {
	color: "#333",
	fontSize: "14px",
	fontWeight: "400",
	margin: "0",
	padding: "0",
	lineHeight: "20px",
	fontFamily:
		'"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
	textAlign: "left" as const,
};

const titleText = {
	color: "#333",
	fontSize: "18px",
	fontWeight: "700",
	margin: "0",
	padding: "0",
	lineHeight: "24px",
	fontFamily:
		'"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
	textAlign: "center" as const,
	textTransform: "uppercase" as const,
	letterSpacing: "1px",
};

const articleHeading = {
	color: "#333",
	fontSize: "28px",
	fontWeight: "700",
	margin: "0 0 4px",
	padding: "0",
	lineHeight: "36px",
	fontFamily:
		'"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
	textAlign: "left" as const,
};

const articleSubheading = {
	color: "#525f7f",
	fontSize: "18px",
	fontWeight: "400",
	margin: "0 0 16px",
	padding: "0",
	lineHeight: "26px",
	fontFamily:
		'"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
	textAlign: "left" as const,
};

const articleDivider = {
	borderColor: "#e6ebf1",
	borderWidth: "1px 0 0 0",
	borderStyle: "solid",
	margin: "0 0 16px",
	width: "100%",
};

const thickBlackBorder = {
	borderColor: "#000000",
	borderWidth: "3px 0 0 0",
	borderStyle: "solid",
	margin: "0",
	marginBottom: "4px",
	width: "100%",
};

const thinBlackBorder = {
	borderColor: "#000000",
	borderWidth: "1px 0 0 0",
	borderStyle: "solid",
	margin: "0",
	width: "100%",
};

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
