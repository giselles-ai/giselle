import { Body, Head, Html, Preview } from "@react-email/components";

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
	const displayInviterEmail = inviterEmail ?? INVITER_EMAIL_PLACEHOLDER;
	const displayJoinUrl = joinUrl ?? JOIN_URL_PLACEHOLDER;

	return (
		<Html>
			<Head />
			<Preview>Invitation to join {displayTeamName} on Giselle</Preview>
			<Body>
				<p>
					You have been invited to join the team {displayTeamName} by{" "}
					{displayInviterEmail}.
				</p>
				<p>
					<a href={displayJoinUrl}>Join the team</a>
				</p>
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
