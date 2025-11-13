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
	EmailFonts,
	EmailHeader,
	EmailFooter,
	main,
	container,
	topBorderSection,
	topBorder,
	section,
	text,
	signatureText,
	link,
	getBaseUrl,
} from "../../components";

interface NewFeatureReleaseEmailProps {
	userName?: string;
	featureName?: string;
	date?: string;
	viewUpdateUrl?: string;
}

export const NewFeatureReleaseEmail = ({
	userName = "there",
	featureName = "Node Builder",
	date = new Date().toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
	}),
	viewUpdateUrl = "https://studio.giselles.ai",
}: NewFeatureReleaseEmailProps) => {
	const baseUrl = getBaseUrl();
	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>New in Giselle: Node Builder</Preview>
			<Body style={main}>
				<Container style={container}>
					<EmailHeader baseUrl={baseUrl} />
					<Section style={headerBannerSection}>
						<Row>
							<Column style={leftColumn}>
								{/* Empty column - reserved for future use */}
							</Column>
							<Column style={centerColumn}>
								<Img
									src={`${baseUrl}/static/giselletimes.png`}
									width="300"
									alt="Giselle Times"
									style={headerBannerImage}
								/>
							</Column>
							<Column style={rightColumn}>
								{/* Empty column - reserved for future use */}
							</Column>
						</Row>
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
								<Heading style={titleText}>New Feature Release</Heading>
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
							Breaking: Node Builder Launches Today
						</Heading>
						<Text style={articleSubheading}>
							A faster, simpler, more visual way to build AI agents.
						</Text>
						<Hr style={articleDivider} />
						<Img
							src={`${baseUrl}/static/new-feature-release-sample.jpg`}
							width="600"
							alt="New feature in Giselle"
							style={image}
						/>
						<Text style={text}>
							We&apos;re excited to announce the launch of Node Builder, a visual
							interface that lets you design and orchestrate AI agents — no code
							required.
						</Text>
						<Text style={text}>
							Build your first workflow, connect models, and deploy instantly.
						</Text>
						<Text style={text}>
							Here&apos;s what&apos;s new:
							<br />
							• Drag-and-drop flow creation
							<br />
							• Live model testing
							<br />
							• Versioning and export to GitHub
						</Text>
						<Text style={text}>
							Try it today →{" "}
							<Link href={viewUpdateUrl} style={link}>
								Open in Giselle Studio
							</Link>
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

NewFeatureReleaseEmail.PreviewProps = {
	userName: "John",
	featureName: "Node Builder",
	date: "December 15, 2025",
	viewUpdateUrl: "https://studio.giselles.ai",
} as NewFeatureReleaseEmailProps;

const headerBannerSection = {
	backgroundColor: "#ffffff",
	padding: "32px 48px 0 48px",
};

const leftColumn = {
	width: "150px",
	verticalAlign: "middle" as const,
};

const centerColumn = {
	width: "300px",
	verticalAlign: "middle" as const,
	textAlign: "center" as const,
};

const rightColumn = {
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
	textAlign: "left" as const,
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
	textAlign: "left" as const,
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

const image = {
	width: "100%",
	maxWidth: "600px",
	display: "block",
	margin: "0 auto",
};

export default NewFeatureReleaseEmail;
