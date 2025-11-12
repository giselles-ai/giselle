import { Heading, Img, Section, Text } from "@react-email/components";

interface EmailHeaderProps {
	heading?: string;
	subheading?: string;
	baseUrl?: string;
}

export const EmailHeader = ({
	heading,
	subheading,
	baseUrl = process.env.NEXT_PUBLIC_SITE_URL ||
		(process.env.NODE_ENV === "development"
			? "http://localhost:3333"
			: "https://studio.giselles.ai"),
}: EmailHeaderProps) => {
	return (
		<>
			<Section style={logoSection}>
				<Img
					src={`${baseUrl}/static/logo.png`}
					width="140"
					height="70"
					alt="Giselle"
					style={logo}
				/>
				{heading && <Heading style={welcomeHeading}>{heading}</Heading>}
				{subheading && <Text style={welcomeText}>{subheading}</Text>}
			</Section>
		</>
	);
};

const logoSection = {
	backgroundColor: "#010318",
	padding: "24px 48px",
	textAlign: "center" as const,
};

const logo = {
	margin: "0 auto",
	display: "block",
	maxWidth: "140px",
};

const welcomeHeading = {
	color: "#b8e8f4",
	fontSize: "24px",
	fontWeight: "500",
	margin: "0 0 8px",
	padding: "0",
	lineHeight: "32px",
	fontFamily:
		'"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
	textAlign: "center" as const,
};

const welcomeText = {
	color: "rgba(247, 249, 253, 0.8)",
	fontSize: "14px",
	lineHeight: "20px",
	margin: "0",
	fontFamily:
		'"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
	textAlign: "center" as const,
	maxWidth: "720px",
	marginLeft: "auto",
	marginRight: "auto",
};

