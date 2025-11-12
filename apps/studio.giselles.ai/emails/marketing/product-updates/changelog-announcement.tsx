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

interface ChangelogAnnouncementEmailProps {
	viewChangelogUrl?: string;
}

export const ChangelogAnnouncementEmail = ({
	viewChangelogUrl = "https://giselles.ai/changelog",
}: ChangelogAnnouncementEmailProps) => {
	const baseUrl = getBaseUrl();
	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>Latest updates from Giselle</Preview>
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
							Stay up to date with the latest changes, improvements, and new
							features in Giselle.
						</Text>
						<Text style={text}>
							Check out our changelog to see what&apos;s new and how it can help
							you build better agents.
						</Text>
						<Button href={viewChangelogUrl} style={button}>
							View Changelog
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

ChangelogAnnouncementEmail.PreviewProps = {
	viewChangelogUrl: "https://giselles.ai/changelog",
} as ChangelogAnnouncementEmailProps;

export default ChangelogAnnouncementEmail;
