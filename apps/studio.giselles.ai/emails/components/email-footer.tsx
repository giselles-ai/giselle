import { Container, Img, Link, Section, Text } from "@react-email/components";

interface EmailFooterProps {
	baseUrl?: string;
}

export const EmailFooter = ({
	baseUrl = process.env.NEXT_PUBLIC_SITE_URL ||
		(process.env.NODE_ENV === "development"
			? "http://localhost:3333"
			: "https://studio.giselles.ai"),
}: EmailFooterProps) => {
	return (
		<Container style={footerContainer}>
			<Section style={footerSection}>
				<Img
					src={`${baseUrl}/static/letter_footer-logo.png`}
					width="100"
					height="39"
					alt="Giselle"
					style={footerLogo}
				/>
				<Text style={footerLinksText}>
					<Link href="https://studio.giselles.ai" style={footerLink}>
						Product
					</Link>
					{" / "}
					<Link href="https://giselles.ai/blog" style={footerLink}>
						Blog
					</Link>
					{" / "}
					<Link
						href="https://docs.giselles.ai/en/guides/introduction"
						style={footerLink}
					>
						Documentation
					</Link>
				</Text>
				<Section style={socialIconsSection}>
					<Link
						href="https://github.com/giselles-ai/giselle"
						style={socialIconLink}
					>
						<Img
							src={`${baseUrl}/static/github-icon.png`}
							width="20"
							height="20"
							alt="GitHub"
							style={socialIcon}
						/>
					</Link>
					<Link
						href="https://www.linkedin.com/showcase/giselles-ai/"
						style={socialIconLink}
					>
						<Img
							src={`${baseUrl}/static/linkedin-icon.png`}
							width="20"
							height="20"
							alt="LinkedIn"
							style={socialIcon}
						/>
					</Link>
					<Link
						href="https://www.facebook.com/GiselleAI/"
						style={socialIconLink}
					>
						<Img
							src={`${baseUrl}/static/facebook-icon.png`}
							width="20"
							height="20"
							alt="Facebook"
							style={socialIcon}
						/>
					</Link>
					<Link href="https://x.com/Giselles_AI" style={socialIconLink}>
						<Img
							src={`${baseUrl}/static/x-icon.png`}
							width="20"
							height="20"
							alt="X"
							style={socialIcon}
						/>
					</Link>
					<Link
						href="https://www.instagram.com/giselle_de_ai"
						style={socialIconLink}
					>
						<Img
							src={`${baseUrl}/static/instagram-icon.png`}
							width="20"
							height="20"
							alt="Instagram"
							style={socialIcon}
						/>
					</Link>
					<Link
						href="https://www.youtube.com/@Giselle_AI"
						style={socialIconLink}
					>
						<Img
							src={`${baseUrl}/static/youtube-icon.png`}
							width="20"
							height="20"
							alt="YouTube"
							style={socialIcon}
						/>
					</Link>
				</Section>
				<Text style={footerCopyright}>
					© {new Date().getFullYear()} Giselle
				</Text>
				<Text style={footerExplanation}>
					You received this email because you signed up for{" "}
					<Link href="https://giselles.ai" style={footerLink}>
						Giselle
					</Link>
					—a platform for building AI agents.
				</Text>
			</Section>
		</Container>
	);
};

const footerContainer = {
	backgroundColor: "transparent",
	margin: "0 auto",
	padding: "0",
	maxWidth: "600px",
};

const footerSection = {
	padding: "32px 48px",
	textAlign: "center" as const,
};

const footerLogo = {
	margin: "0 auto 16px",
	display: "block",
	maxWidth: "100px",
	opacity: 0.3,
};

const footerLinksText = {
	color: "rgba(247, 249, 253, 0.6)",
	fontSize: "12px",
	lineHeight: "18px",
	marginBottom: "16px",
	textAlign: "center" as const,
	fontFamily:
		'"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
	letterSpacing: "0.5px",
};

const socialIconsSection = {
	marginBottom: "16px",
	textAlign: "center" as const,
};

const socialIconLink = {
	display: "inline-block",
	margin: "0 8px",
	textDecoration: "none",
};

const socialIcon = {
	display: "block",
	opacity: 0.6,
};

const footerCopyright = {
	color: "rgba(247, 249, 253, 0.6)",
	fontSize: "12px",
	lineHeight: "18px",
	margin: "0 0 8px",
	fontFamily:
		'"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const footerExplanation = {
	color: "rgba(247, 249, 253, 0.6)",
	fontSize: "12px",
	lineHeight: "18px",
	margin: "0",
	fontFamily:
		'"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const footerLink = {
	color: "#b8e8f4",
	textDecoration: "none",
	fontSize: "12px",
	fontFamily:
		'"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};
