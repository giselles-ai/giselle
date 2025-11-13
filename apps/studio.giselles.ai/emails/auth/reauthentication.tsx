import {
	Body,
	Container,
	Head,
	Hr,
	Html,
	Preview,
	Section,
	Text,
} from "@react-email/components";
import {
	code,
	codeContainer,
	container,
	EmailFonts,
	EmailFooter,
	EmailHeader,
	getBaseUrl,
	h1,
	main,
	section,
	text,
	topBorder,
	topBorderSection,
} from "../components";

interface ReauthenticationEmailProps {
	token?: string;
}

const SUPABASE_TOKEN_PLACEHOLDER = "{{ .Token }}";

export const ReauthenticationEmail = ({
	token,
}: ReauthenticationEmailProps) => {
	const displayToken = token ?? SUPABASE_TOKEN_PLACEHOLDER;
	const baseUrl = getBaseUrl();

	return (
		<Html>
			<Head>
				<EmailFonts />
			</Head>
			<Preview>Confirm reauthentication</Preview>
			<Body style={main}>
				<Container style={container}>
					<EmailHeader
						heading="Verify your identity."
						subheading="Secure access with Giselle."
						baseUrl={baseUrl}
					/>
					<Section style={topBorderSection}>
						<Hr style={topBorder} />
					</Section>
					<Section style={section}>
						<Text style={{ ...h1, marginBottom: "16px" }}>
							Confirm reauthentication
						</Text>
						<Text style={text}>Enter the code:</Text>
						<Section style={codeContainer}>
							<Text style={code}>{displayToken}</Text>
						</Section>
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

ReauthenticationEmail.PreviewProps = {
	token: "123456",
} as ReauthenticationEmailProps;

export default ReauthenticationEmail;
