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

interface MilestoneCelebrationEmailProps {
	userName?: string;
	milestone?: string;
	celebrateUrl?: string;
}

export const MilestoneCelebrationEmail = ({
	userName = "there",
	milestone = "100 agents created",
	celebrateUrl = "https://studio.giselles.ai",
}: MilestoneCelebrationEmailProps) => {
	const baseUrl = getBaseUrl();
	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>Congratulations on reaching {milestone}!</Preview>
			<Body style={main}>
				<Container style={container}>
					<EmailHeader
						heading="A year of creation."
						subheading="Thank you for building with us."
						baseUrl={baseUrl}
					/>
					<Section style={topBorderSection}>
						<Hr style={topBorder} />
					</Section>
					<Section style={section}>
						<Text style={text}>
							Congratulations, {userName}! You&apos;ve reached an incredible
							milestone: {milestone}.
						</Text>
						<Text style={text}>
							Your dedication to building AI agents inspires us. Keep creating
							and pushing the boundaries of what&apos;s possible.
						</Text>
						<Button href={celebrateUrl} style={button}>
							Celebrate
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

MilestoneCelebrationEmail.PreviewProps = {
	userName: "John",
	milestone: "100 agents created",
	celebrateUrl: "https://studio.giselles.ai",
} as MilestoneCelebrationEmailProps;

export default MilestoneCelebrationEmail;
