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
			<Preview>Help us improve Giselle</Preview>
			<Body style={main}>
				<Container style={container}>
					<EmailHeader
						heading="Let's grow together."
						subheading="Become a Giselle Ambassador."
						baseUrl={baseUrl}
					/>
					<Section style={topBorderSection}>
						<Hr style={topBorder} />
					</Section>
					<Section style={section}>
						<Text style={text}>
							Hi {userName}, your feedback helps us build a better Giselle.
						</Text>
						<Text style={text}>
							Take a quick survey and share your thoughts. It only takes a few
							minutes, and your input shapes our roadmap.
						</Text>
						<Button href={surveyUrl} style={button}>
							Take Survey
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

FeedbackSurveyEmail.PreviewProps = {
	userName: "John",
	surveyUrl: "https://giselles.ai/feedback",
} as FeedbackSurveyEmailProps;

export default FeedbackSurveyEmail;
