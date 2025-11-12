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

interface FirstWorkspaceEmailProps {
	tutorialUrl?: string;
}

export const FirstWorkspaceEmail = ({
	tutorialUrl = "https://docs.giselles.ai/en/guides/introduction",
}: FirstWorkspaceEmailProps) => {
	const baseUrl = getBaseUrl();
	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>Build your first agent in 3 minutes ⚡</Preview>
			<Body style={main}>
				<Container style={container}>
					<EmailHeader
						heading="Your first workspace."
						subheading="Ready when you are."
						baseUrl={baseUrl}
					/>
					<Section style={topBorderSection}>
						<Hr style={topBorder} />
					</Section>
					<Section style={section}>
						<Text style={text}>
							In Giselle, you can design multi-model AI workflows visually.
						</Text>
						<Text style={text}>
							Follow this short tutorial to create your first agent and connect
							it to GitHub or Vercel.
						</Text>
						<Button href={tutorialUrl} style={button}>
							Open the tutorial
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

FirstWorkspaceEmail.PreviewProps = {
	tutorialUrl: "https://docs.giselles.ai/en/guides/introduction",
} as FirstWorkspaceEmailProps;

export default FirstWorkspaceEmail;

