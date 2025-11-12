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

interface YearInReviewEmailProps {
	userName?: string;
	agentsCreated?: number;
	viewHighlightsUrl?: string;
}

export const YearInReviewEmail = ({
	userName = "there",
	agentsCreated = 0,
	viewHighlightsUrl = "https://studio.giselles.ai/year-in-review",
}: YearInReviewEmailProps) => {
	const baseUrl = getBaseUrl();
	const currentYear = new Date().getFullYear();
	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>Your {currentYear} journey with Giselle ✨</Preview>
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
							This year, thousands of agents were created in Giselle — and you,
							{userName}, were part of it.
						</Text>
						{agentsCreated > 0 && (
							<Text style={text}>
								You created <strong>{agentsCreated}</strong> agent
								{agentsCreated !== 1 ? "s" : ""} this year.
							</Text>
						)}
						<Text style={text}>
							Here&apos;s a look back at your milestones and what&apos;s coming
							next.
						</Text>
						<Button href={viewHighlightsUrl} style={button}>
							View Your {currentYear} Highlights
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

YearInReviewEmail.PreviewProps = {
	userName: "John",
	agentsCreated: 5,
	viewHighlightsUrl: "https://studio.giselles.ai/year-in-review",
} as YearInReviewEmailProps;

export default YearInReviewEmail;
