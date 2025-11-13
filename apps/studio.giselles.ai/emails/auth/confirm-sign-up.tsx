import { Body, Head, Html, Preview } from "@react-email/components";

interface ConfirmSignUpEmailProps {
	token?: string;
}

const SUPABASE_TOKEN_PLACEHOLDER = "{{ .Token }}";

export const ConfirmSignUpEmail = ({ token }: ConfirmSignUpEmailProps) => {
	const displayToken = token ?? SUPABASE_TOKEN_PLACEHOLDER;
	return (
		<Html>
			<Head />
			<Preview>Verification code for Giselle</Preview>
			<Body>
				<h2>Giselle</h2>
				<h3>Verification code</h3>
				<p>Enter the following verification code when prompted:</p>
				<p style={{ fontSize: "24px" }}>
					<b>{displayToken}</b>
				</p>
				<p>To protect your account, do not share this code.</p>
			</Body>
		</Html>
	);
};

ConfirmSignUpEmail.PreviewProps = {
	token: "123456",
} as ConfirmSignUpEmailProps;

export default ConfirmSignUpEmail;
