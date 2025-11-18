import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Preview,
	Section,
	Text,
} from "@react-email/components";
import {
	button,
	container,
	EmailFonts,
	EmailFooter,
	EmailHeader,
	getEmailAssetUrl,
	h1,
	main,
	section,
	text,
	topBorder,
	topBorderSection,
} from "../../components";

interface MilestoneCelebrationEmailProps {
	seeWhatsNextUrl?: string;
}

export const MilestoneCelebrationEmail = ({
	seeWhatsNextUrl = "https://studio.giselles.ai",
}: MilestoneCelebrationEmailProps) => {
	const heroImageSrc = getEmailAssetUrl("milestone-celebration-1.jpg");
	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>We&apos;ve reached a new milestone — thanks to you</Preview>
			<Body style={main}>
				<Container style={container}>
					<EmailHeader />
					<Section style={imageSection}>
						<Img
							src={heroImageSrc}
							width="600"
							alt="Milestone celebration"
							style={image}
						/>
					</Section>
					<Section style={section}>
						<Heading style={h1}>
							We&apos;ve Reached a New Milestone — Thanks to You.
						</Heading>
						<Text style={text}>
							10,000 agents created. 1,200 teams building.
						</Text>
						<Text style={text}>
							What started as an idea became a growing movement — and
							you&apos;re part of it.
						</Text>
						<Text style={text}>
							Let&apos;s keep building the future of AI orchestration together.
						</Text>
						<Button href={seeWhatsNextUrl} style={button}>
							See What&apos;s Next →
						</Button>
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

MilestoneCelebrationEmail.PreviewProps = {
	seeWhatsNextUrl: "https://studio.giselles.ai",
} as MilestoneCelebrationEmailProps;

const imageSection = {
	padding: "0",
	margin: "0",
};

const image = {
	width: "100%",
	maxWidth: "600px",
	display: "block",
	margin: "0 auto",
};

export default MilestoneCelebrationEmail;
