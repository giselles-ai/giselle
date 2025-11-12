import {
	Body,
	Button,
	Container,
	Font,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Link,
	Preview,
	Section,
	Text,
} from "@react-email/components";

interface TeamInvitationEmailProps {
	teamName?: string;
	inviterEmail?: string;
	joinUrl?: string;
}

const TEAM_NAME_PLACEHOLDER = "{{ team_name }}";
const INVITER_EMAIL_PLACEHOLDER = "{{ inviter_email }}";
const JOIN_URL_PLACEHOLDER = "{{ join_url }}";

const baseUrl =
	process.env.NEXT_PUBLIC_SITE_URL ||
	(process.env.NODE_ENV === "development"
		? "http://localhost:3333"
		: "https://studio.giselles.ai");

export const TeamInvitationEmail = ({
	teamName,
	inviterEmail,
	joinUrl,
}: TeamInvitationEmailProps) => {
	const displayTeamName = teamName ?? TEAM_NAME_PLACEHOLDER;
	const _displayInviterEmail = inviterEmail ?? INVITER_EMAIL_PLACEHOLDER;
	const displayJoinUrl = joinUrl ?? JOIN_URL_PLACEHOLDER;

	return (
		<Html>
			<Head>
				<Font
					fontFamily="DM Sans"
					fallbackFontFamily="Arial"
					webFont={{
						url: "https://fonts.gstatic.com/s/dmsans/v14/rP2Hp2ywxg089UriCZOIHTWEBlw.woff2",
						format: "woff2",
					}}
					fontWeight={400}
					fontStyle="normal"
				/>
				<Font
					fontFamily="DM Sans"
					fallbackFontFamily="Arial"
					webFont={{
						url: "https://fonts.gstatic.com/s/dmsans/v14/rP2Cp2ywxg089UriAWCrOB8D.woff2",
						format: "woff2",
					}}
					fontWeight={500}
					fontStyle="normal"
				/>
				<Font
					fontFamily="DM Sans"
					fallbackFontFamily="Arial"
					webFont={{
						url: "https://fonts.gstatic.com/s/dmsans/v14/rP2Cp2ywxg089UriASitOB8D.woff2",
						format: "woff2",
					}}
					fontWeight={700}
					fontStyle="normal"
				/>
			</Head>
			<Preview>Invitation to join {displayTeamName} on Giselle</Preview>
			<Body style={main}>
				<Container style={container}>
					<Section style={logoSection}>
						<Img
							src={`${baseUrl}/static/logo.png`}
							width="140"
							height="70"
							alt="Giselle"
							style={logo}
						/>
						<Heading style={welcomeHeading}>
							You&apos;ve been invited to collaborate in Giselle.
						</Heading>
						<Text style={welcomeText}>
							Join your team and start building together.
						</Text>
					</Section>
					<Section style={topBorderSection}>
						<Hr style={topBorder} />
					</Section>
					<Section style={section}>
						<Heading style={h1}>Team Invitation</Heading>
						<Text style={text}>
							You&apos;ve been invited to join the team{" "}
							<strong style={highlightText}>{displayTeamName}</strong> by{" "}
							<strong style={highlightText}>{_displayInviterEmail}</strong>.
						</Text>
						<Text style={text}>
							Click the button below to accept and access your shared workspace.
						</Text>
						<Button href={displayJoinUrl} style={button}>
							Join the team
						</Button>
						<Text style={text}>
							If you didn&apos;t expect this invitation, you can safely ignore
							this email.
						</Text>
						<Text style={signatureText}>—</Text>
						<Text style={signatureText}>The Giselle Team</Text>
						<Text style={signatureText}>
							<Link href="https://giselles.ai" style={link}>
								https://giselles.ai
							</Link>
						</Text>
					</Section>
					<Section style={topBorderSection}>
						<Hr style={topBorder} />
					</Section>
				</Container>
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
			</Body>
		</Html>
	);
};

TeamInvitationEmail.PreviewProps = {
	teamName: "Acme Design",
	inviterEmail: "alex@example.com",
	joinUrl: "https://example.com/join/abc",
} as TeamInvitationEmailProps;

export default TeamInvitationEmail;

const main = {
	backgroundColor: "#010318",
	fontFamily:
		'"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
	backgroundColor: "#ffffff",
	margin: "0 auto",
	padding: "0",
	marginBottom: "32px",
};

const topBorderSection = {
	padding: "0",
	margin: "0",
};

const topBorder = {
	borderColor: "#64759B",
	borderWidth: "4px 0 0 0",
	borderStyle: "solid",
	margin: "0",
	width: "100%",
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

const section = {
	padding: "32px 48px",
};

const h1 = {
	color: "#333",
	fontSize: "24px",
	fontWeight: "500",
	margin: "0",
	padding: "0",
	lineHeight: "32px",
	textAlign: "center" as const,
	fontFamily:
		'"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const text = {
	color: "#525f7f",
	fontSize: "16px",
	lineHeight: "24px",
	marginBottom: "16px",
	textAlign: "center" as const,
	fontFamily:
		'"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const button = {
	backgroundColor: "#1D2551",
	borderRadius: "4px",
	color: "#fff",
	fontSize: "16px",
	fontWeight: "bold",
	textDecoration: "none",
	textAlign: "center" as const,
	display: "block",
	padding: "12px 24px",
	marginBottom: "16px",
	fontFamily:
		'"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const signatureText = {
	color: "#525f7f",
	fontSize: "14px",
	lineHeight: "20px",
	marginBottom: "8px",
	fontFamily:
		'"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const link = {
	color: "#007ee6",
	textDecoration: "none",
};

const highlightText = {
	backgroundColor: "#C3DCF8",
	padding: "0px 4px",
	paddingBottom: "3px",
	color: "#333",
	fontWeight: "bold",
	lineHeight: "0.5",
	display: "inline-block",
	verticalAlign: "baseline",
	marginTop: "2px",
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
