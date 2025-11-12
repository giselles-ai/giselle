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
	viewUpdateUrl?: string;
}

export const NewFeatureReleaseEmail = ({
	userName = "there",
	featureName = "Node Builder",
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
					<EmailHeader
						heading={`Introducing the new ${featureName}.`}
						subheading="Your next tool for building smarter agents."
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
							We&apos;re excited to announce the launch of Node Builder, a visual
							interface that lets you design and orchestrate AI agents — no code
							required.
						</Text>
						<Section style={imageSection}>
							<Img
								src={`${baseUrl}/static/new-feature-release-sample.jpg`}
								width="600"
								alt="New feature in Giselle"
								style={image}
							/>
						</Section>
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
	viewUpdateUrl: "https://studio.giselles.ai",
} as NewFeatureReleaseEmailProps;

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

export default NewFeatureReleaseEmail;
