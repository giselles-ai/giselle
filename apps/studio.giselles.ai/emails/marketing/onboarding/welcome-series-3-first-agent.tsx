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

interface WelcomeSeries3FirstAgentEmailProps {
	userName?: string;
	createAgentUrl?: string;
}

export const WelcomeSeries3FirstAgentEmail = ({
	userName = "there",
	createAgentUrl = "https://studio.giselles.ai/agents/new",
}: WelcomeSeries3FirstAgentEmailProps) => {
	const baseUrl = getBaseUrl();
	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>Ready to build your first agent?</Preview>
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
							You&apos;re all set, {userName}! Now let&apos;s create your first
							AI agent.
						</Text>
						<Text style={text}>
							Start with a simple workflow or explore our templates. Your first
							agent is just a few clicks away.
						</Text>
						<Button href={createAgentUrl} style={button}>
							Create Your First Agent
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

WelcomeSeries3FirstAgentEmail.PreviewProps = {
	userName: "John",
	createAgentUrl: "https://studio.giselles.ai/agents/new",
} as WelcomeSeries3FirstAgentEmailProps;

export default WelcomeSeries3FirstAgentEmail;
