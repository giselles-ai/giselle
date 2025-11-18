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

interface YearInReviewEmailProps {
	viewYearInGiselleUrl?: string;
}

export const YearInReviewEmail = ({
	viewYearInGiselleUrl = "https://studio.giselles.ai/year-in-review",
}: YearInReviewEmailProps) => {
	const heroImageSrc = getEmailAssetUrl("year-in-review-1.jpg");
	const currentYear = new Date().getFullYear();
	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>
				{String(currentYear)} in Review — A Year of Building Together
			</Preview>
			<Body style={main}>
				<Container style={container}>
					<EmailHeader />
					<Section style={imageSection}>
						<Img
							src={heroImageSrc}
							width="600"
							alt="Year in review"
							style={image}
						/>
					</Section>
					<Section style={section}>
						<Heading style={h1}>
							{currentYear} in Review — A Year of Building Together.
						</Heading>
						<Text style={text}>
							From launching Node Builder to growing our builder community, this
							year has been full of creation and connection.
						</Text>
						<Text style={text}>
							Here&apos;s a look back at the moments that defined {currentYear}{" "}
							— and a glimpse of what&apos;s next.
						</Text>
						<Button href={viewYearInGiselleUrl} style={button}>
							View Your Year in Giselle →
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

YearInReviewEmail.PreviewProps = {
	viewYearInGiselleUrl: "https://studio.giselles.ai/year-in-review",
} as YearInReviewEmailProps;

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

export default YearInReviewEmail;
