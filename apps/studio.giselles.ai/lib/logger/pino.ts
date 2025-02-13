import pino from "pino";

const partialCensor = (value: string) => {
	if (!value || typeof value !== "string") return value;
	return `${value.slice(0, 3)}***`;
};

const baseConfig = {
	level: process.env.LOGLEVEL || "info",
	redact: {
		paths: [
			"code",
			"credential.accessToken",
			"credential.refreshToken",
			"data.email",
			"data.name",
			"data.given_name",
			"data.family_name",
			"googleUser.name",
			"googleUser.email",
		],
		censor: partialCensor,
	},
};

export const logger = (() => {
	if (process.env.NODE_ENV === "development") {
		// enable pretty logging only in development
		return pino({
			...baseConfig,
			transport: {
				target: "pino-pretty",
			},
		});
	}

	return pino(baseConfig);
})();
