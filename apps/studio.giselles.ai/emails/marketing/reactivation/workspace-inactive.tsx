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

interface WorkspaceInactiveEmailProps {
	userName?: string;
	workspaceName?: string;
	returnUrl?: string;
}

export const WorkspaceInactiveEmail = ({
	userName = "there",
	workspaceName = "your workspace",
	returnUrl = "https://studio.giselles.ai",
}: WorkspaceInactiveEmailProps) => {
	const baseUrl = getBaseUrl();
	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>Your workspace is waiting for you</Preview>
			<Body style={main}>
				<Container style={container}>
					<EmailHeader
						heading="It's been a while."
						subheading="Your agents are waiting for you."
						baseUrl={baseUrl}
					/>
					<Section style={topBorderSection}>
						<Hr style={topBorder} />
					</Section>
					<Section style={section}>
						<Text style={text}>
							Hi {userName}, {workspaceName} hasn&apos;t been active recently.
						</Text>
						<Text style={text}>
							Your agents are ready to help. Return to your workspace and
							continue building.
						</Text>
						<Button href={returnUrl} style={button}>
							Return to Giselle
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

WorkspaceInactiveEmail.PreviewProps = {
	userName: "John",
	workspaceName: "My Workspace",
	returnUrl: "https://studio.giselles.ai",
} as WorkspaceInactiveEmailProps;

export default WorkspaceInactiveEmail;
