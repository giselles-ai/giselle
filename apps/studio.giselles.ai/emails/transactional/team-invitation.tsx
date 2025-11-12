import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Link,
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
	h1,
	highlightText,
	signatureText,
	link,
	getBaseUrl,
} from "../components";

interface TeamInvitationEmailProps {
	teamName?: string;
	inviterEmail?: string;
	joinUrl?: string;
}

const TEAM_NAME_PLACEHOLDER = "{{ team_name }}";
const INVITER_EMAIL_PLACEHOLDER = "{{ inviter_email }}";
const JOIN_URL_PLACEHOLDER = "{{ join_url }}";

export const TeamInvitationEmail = ({
	teamName,
	inviterEmail,
	joinUrl,
}: TeamInvitationEmailProps) => {
	const displayTeamName = teamName ?? TEAM_NAME_PLACEHOLDER;
	const _displayInviterEmail = inviterEmail ?? INVITER_EMAIL_PLACEHOLDER;
	const displayJoinUrl = joinUrl ?? JOIN_URL_PLACEHOLDER;
	const baseUrl = getBaseUrl();

	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>Invitation to join {displayTeamName} on Giselle</Preview>
			<Body style={main}>
				<Container style={container}>
					<EmailHeader
						heading="You've been invited to collaborate in Giselle."
						subheading="Join your team and start building together."
						baseUrl={baseUrl}
					/>
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
						<Text style={signatureText}>
							—<br />
							The Giselle Team
							<br />
							<Link href="https://giselles.ai" style={link}>
								https://giselles.ai
							</Link>
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

TeamInvitationEmail.PreviewProps = {
	teamName: "Acme Design",
	inviterEmail: "alex@example.com",
	joinUrl: "https://example.com/join/abc",
} as TeamInvitationEmailProps;

export default TeamInvitationEmail;
