import {
	Body,
	Container,
	Head,
	Heading,
	Html,
	Preview,
	Text,
} from "@react-email/components";

interface SampleEmailProps {
	username?: string;
}

export const SampleEmail = ({ username = "there" }: SampleEmailProps) => {
	return (
		<Html>
			<Head />
			<Preview>Welcome to Giselle!</Preview>
			<Body style={main}>
				<Container style={container}>
					<Heading style={h1}>Welcome to Giselle, {username}!</Heading>
					<Text style={text}>
						We're excited to have you on board. Get started by exploring our
						platform.
					</Text>
				</Container>
			</Body>
		</Html>
	);
};

SampleEmail.PreviewProps = {
	username: "Alice",
} as SampleEmailProps;

export default SampleEmail;

const main = {
	backgroundColor: "#ffffff",
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
	backgroundColor: "#ffffff",
	margin: "0 auto",
	padding: "20px 0 48px",
	marginBottom: "64px",
};

const h1 = {
	color: "#333",
	fontSize: "24px",
	fontWeight: "bold",
	margin: "40px 0",
	padding: "0",
};

const text = {
	color: "#333",
	fontSize: "16px",
	lineHeight: "26px",
};
