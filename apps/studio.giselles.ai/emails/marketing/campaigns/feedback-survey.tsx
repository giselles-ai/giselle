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
	signatureText,
	getBaseUrl,
} from "../../components";

interface FeedbackSurveyEmailProps {
	userName?: string;
	surveyUrl?: string;
}

export const FeedbackSurveyEmail = ({
	userName = "there",
	surveyUrl = "https://giselles.ai/feedback",
}: FeedbackSurveyEmailProps) => {
	const baseUrl = getBaseUrl();
	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>We'd love your feedback</Preview>
			<Body style={main}>
				<Container style={container}>
					<EmailHeader
						heading="We'd love your feedback."
						subheading="Your thoughts help us make Giselle better."
						baseUrl={baseUrl}
					/>
					<Section style={topBorderSection}>
						<Hr style={topBorder} />
					</Section>
					<Section style={section}>
						<Text style={text}>
							Hi {userName},<br />
							<br />
							We&apos;re collecting quick feedback from builders like you.
							<br />
							<br />
							It only takes 30 seconds — and helps shape our next release.
						</Text>
						<Button href={surveyUrl} style={button}>
							Share Feedback
						</Button>
						<Text style={signatureText}>
							Thanks for being part of the journey.
							<br />
							—<br />
							The Giselle Team
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

FeedbackSurveyEmail.PreviewProps = {
	userName: "John",
	surveyUrl: "https://giselles.ai/feedback",
} as FeedbackSurveyEmailProps;

export default FeedbackSurveyEmail;
