import { Body, Head, Html, Preview } from "@react-email/components";

interface ReauthenticationEmailProps {
	token?: string;
}

const SUPABASE_TOKEN_PLACEHOLDER = "{{ .Token }}";

export const ReauthenticationEmail = ({
	token,
}: ReauthenticationEmailProps) => {
	const displayToken = token ?? SUPABASE_TOKEN_PLACEHOLDER;

	return (
		<Html>
			<Head />
			<Preview>Confirm reauthentication</Preview>
			<Body>
				<h2>Confirm reauthentication</h2>
				<p>Enter the code: {displayToken}</p>
			</Body>
		</Html>
	);
};

ReauthenticationEmail.PreviewProps = {
	token: "123456",
} as ReauthenticationEmailProps;

export default ReauthenticationEmail;
