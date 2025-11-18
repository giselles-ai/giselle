import { Heading, Img, Section, Text } from "@react-email/components";

import { getEmailAssetUrl } from "../utils/email-assets";

interface EmailHeaderProps {
	heading?: string;
	subheading?: string;
}

export const EmailHeader = ({ heading, subheading }: EmailHeaderProps) => {
	const logoSrc = getEmailAssetUrl("logo.png");
	return (
		<Section style={logoSection}>
			<Img src={logoSrc} width="140" height="70" alt="Giselle" style={logo} />
			{heading && <Heading style={welcomeHeading}>{heading}</Heading>}
			{subheading && <Text style={welcomeText}>{subheading}</Text>}
		</Section>
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
