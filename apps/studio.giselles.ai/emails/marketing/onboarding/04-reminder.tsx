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

interface ReminderEmailProps {
	returnToGiselleUrl?: string;
}

export const ReminderEmail = ({
	returnToGiselleUrl = "https://studio.giselles.ai",
}: ReminderEmailProps) => {
	const baseUrl = getBaseUrl();
	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>Your workspace is waiting 🌙</Preview>
			<Body style={main}>
				<Container style={container}>
					<EmailHeader
						heading="Come back to Giselle."
						subheading="Your agents are ready to build."
						baseUrl={baseUrl}
					/>
					<Section style={topBorderSection}>
						<Hr style={topBorder} />
					</Section>
					<Section style={section}>
						<Text style={text}>
							You started setting up Giselle but haven&apos;t launched your
							first agent yet.
						</Text>
						<Text style={text}>
							Pick up right where you left off — it only takes a moment to
							continue.
						</Text>
						<Button href={returnToGiselleUrl} style={button}>
							Return to Giselle
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

ReminderEmail.PreviewProps = {
	returnToGiselleUrl: "https://studio.giselles.ai",
} as ReminderEmailProps;

export default ReminderEmail;

