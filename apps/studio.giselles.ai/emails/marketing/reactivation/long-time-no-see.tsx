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

interface LongTimeNoSeeEmailProps {
	userName?: string;
	returnUrl?: string;
	examplesGalleryUrl?: string;
	releaseNotesUrl?: string;
}

export const LongTimeNoSeeEmail = ({
	userName = "there",
	returnUrl = "https://studio.giselles.ai",
	examplesGalleryUrl = "https://giselles.ai",
	releaseNotesUrl = "https://docs.giselles.ai/en/releases/release-notes",
}: LongTimeNoSeeEmailProps) => {
	const baseUrl = getBaseUrl();
	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>We've missed you at Giselle 💫</Preview>
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
							Hi {userName},<br />
							<br />
							It&apos;s been a while since you last visited Giselle.
							<br />
							<br />
							Your Stage and workspace are still here — ready whenever you are.
							<br />
							<br />
							We&apos;ve been busy. New templates, model updates, and
							orchestration features have been added to make building even
							smoother. Check out our{" "}
							<Link href={releaseNotesUrl} style={link}>
								release notes
							</Link>{" "}
							to see what&apos;s new.
							<br />
							<br />
							Jump back in, explore what&apos;s new, and keep creating.
						</Text>
						<Button href={returnUrl} style={button}>
							Return to Giselle
						</Button>
						<Text style={text}>
							Need help or inspiration? Visit our{" "}
							<Link href={examplesGalleryUrl} style={link}>
								examples gallery
							</Link>{" "}
							or reach out anytime at{" "}
							<Link href="mailto:support@giselles.ai" style={link}>
								support@giselles.ai
							</Link>
							.
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

LongTimeNoSeeEmail.PreviewProps = {
	userName: "John",
	returnUrl: "https://studio.giselles.ai",
	examplesGalleryUrl: "https://giselles.ai",
	releaseNotesUrl: "https://docs.giselles.ai/en/releases/release-notes",
} as LongTimeNoSeeEmailProps;

export default LongTimeNoSeeEmail;
