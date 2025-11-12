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

interface WelcomeEmailProps {
	firstName?: string;
	stageUrl?: string;
	createWorkspaceUrl?: string;
	examplesGalleryUrl?: string;
}

export const WelcomeEmail = ({
	firstName = "there",
	stageUrl = "https://studio.giselles.ai/stage",
	createWorkspaceUrl = "https://studio.giselles.ai",
	examplesGalleryUrl = "https://giselles.ai",
}: WelcomeEmailProps) => {
	const baseUrl = getBaseUrl();
	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>Welcome to Giselle — your AI workspace starts here 🪶</Preview>
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
							Hi {firstName},<br />
							<br />
							Your account is ready, and you can now explore Giselle&apos;s
							Stage — your personal environment to test and run your AI agents
							instantly.
							<br />
							<br />
							Select an agent, input parameters, and watch it perform. No setup
							required — just start testing.
							<br />
							<br />
							Or express your ideas by creating your first workspace.
						</Text>
						<Button href={stageUrl} style={button}>
							The stage awaits
						</Button>
						<Button href={createWorkspaceUrl} style={button}>
							Create your workspace
						</Button>
						<Text style={text}>
							Need inspiration? Visit our{" "}
							<Link href={examplesGalleryUrl} style={link}>
								examples gallery
							</Link>{" "}
							or contact us anytime at{" "}
							<Link href="mailto:support@giselles.ai" style={link}>
								support@giselles.ai
							</Link>
							.
						</Text>
						<Text style={signatureText}>
							If you didn&apos;t sign up for Giselle, you can safely ignore
							this email.
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

WelcomeEmail.PreviewProps = {
	firstName: "John",
	stageUrl: "https://studio.giselles.ai/stage",
	createWorkspaceUrl: "https://studio.giselles.ai",
	examplesGalleryUrl: "https://giselles.ai",
} as WelcomeEmailProps;

export default WelcomeEmail;

