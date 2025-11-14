import { Font, Head } from "@react-email/components";

export const EmailFonts = () => {
	return (
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
	);
};
