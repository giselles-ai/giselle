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
	firstName?: string;
	createWorkspaceUrl?: string;
	stageUrl?: string;
	docsUrl?: string;
}

export const FirstWorkspaceEmail = ({
	firstName = "there",
	createWorkspaceUrl = "https://studio.giselles.ai",
	stageUrl = "https://studio.giselles.ai/stage",
	docsUrl = "https://docs.giselles.ai/en/guides/introduction",
}: FirstWorkspaceEmailProps) => {
	const baseUrl = getBaseUrl();
	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>Ready to collaborate? Create your workspace 🛠️</Preview>
			<Body style={main}>
				<Container style={container}>
					<EmailHeader
						heading="Ready to collaborate?"
						subheading="Create your workspace."
						baseUrl={baseUrl}
					/>
					<Section style={topBorderSection}>
						<Hr style={topBorder} />
					</Section>
					<Section style={section}>
						<Text style={text}>
							Hi {firstName},<br />
							<br />
							You&apos;ve explored Giselle&apos;s Stage — now it&apos;s time to
							take the next step.
							<br />
							<br />
							Create a dedicated workspace for your team to collaborate, build
							agents visually with the Node Builder, and manage integrations
							together — all in one place.
							<br />
							<br />
							Workspaces are shared within your team, allowing everyone to
							collaborate on building and managing AI agents together. Connect
							GitHub, use multiple AI models, and access your knowledge store —
							everything you need to build powerful agents.
						</Text>
						<Button href={createWorkspaceUrl} style={button}>
							Create your workspace
						</Button>
						<Text style={text}>
							Need help getting started? Check out our{" "}
							<Link href={docsUrl} style={link}>
								documentation
							</Link>
							.
							<br />
							<br />
							Or keep experimenting in your personal Stage.
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

FirstWorkspaceEmail.PreviewProps = {
	firstName: "John",
	createWorkspaceUrl: "https://studio.giselles.ai",
	stageUrl: "https://studio.giselles.ai/stage",
	docsUrl: "https://docs.giselles.ai/en/guides/introduction",
} as FirstWorkspaceEmailProps;

export default FirstWorkspaceEmail;

