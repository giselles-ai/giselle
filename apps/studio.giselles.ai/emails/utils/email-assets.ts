const DEFAULT_PREVIEW_HOST = "http://localhost:3333";
const DEFAULT_PRODUCTION_HOST = "https://studio.giselles.ai";

// React Email injects EMAILS_DIR_ABSOLUTE_PATH when the preview server runs.
const isReactEmailPreview = Boolean(process.env.EMAILS_DIR_ABSOLUTE_PATH);

const resolveBaseHost = () => {
	// 1. Next.js public site URL
	if (process.env.NEXT_PUBLIC_SITE_URL) {
		return process.env.NEXT_PUBLIC_SITE_URL;
	}

	// 2. Vercel preview/production environment
	if (process.env.VERCEL_URL) {
		return `https://${process.env.VERCEL_URL}`;
	}

	// 3. Fallback to defaults
	return process.env.NODE_ENV === "development"
		? DEFAULT_PREVIEW_HOST
		: DEFAULT_PRODUCTION_HOST;
};

const baseHost = resolveBaseHost().replace(/\/$/, ""); // Remove trailing slash

const assetPath = isReactEmailPreview ? "/static" : "/emails";

export const getEmailAssetUrl = (assetName: string) => {
	const name = assetName.replace(/^\/+/, ""); // Remove leading slashes
	return `${baseHost}${assetPath}/${name}`;
};
