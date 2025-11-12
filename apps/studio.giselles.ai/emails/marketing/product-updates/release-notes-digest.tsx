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

interface ReleaseNotesDigestEmailProps {
	version?: string;
	viewReleaseNotesUrl?: string;
}

export const ReleaseNotesDigestEmail = ({
	version = "v2.1.0",
	viewReleaseNotesUrl = "https://giselles.ai/changelog",
}: ReleaseNotesDigestEmailProps) => {
	const baseUrl = getBaseUrl();
	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>What&apos;s new in Giselle {version}</Preview>
			<Body style={main}>
				<Container style={container}>
					<EmailHeader
						heading="New in Giselle."
						subheading="Smarter, faster, and more connected than ever."
						baseUrl={baseUrl}
					/>
					<Section style={topBorderSection}>
						<Hr style={topBorder} />
					</Section>
					<Section style={section}>
						<Text style={text}>
							We&apos;ve shipped {version} with new features, improvements, and
							bug fixes.
						</Text>
						<Text style={text}>
							Check out the full release notes to see what&apos;s changed and how
							it can help you build better agents.
						</Text>
						<Button href={viewReleaseNotesUrl} style={button}>
							View Release Notes
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

ReleaseNotesDigestEmail.PreviewProps = {
	version: "v2.1.0",
	viewReleaseNotesUrl: "https://giselles.ai/changelog",
} as ReleaseNotesDigestEmailProps;

export default ReleaseNotesDigestEmail;
