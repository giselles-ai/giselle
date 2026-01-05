export class GiselleSdkError extends Error {
	name = "GiselleSdkError";
}

export class ConfigurationError extends GiselleSdkError {
	name = "ConfigurationError";
}

export class ApiError extends GiselleSdkError {
	name = "ApiError";

	constructor(
		message: string,
		public readonly status: number,
		public readonly responseText: string,
	) {
		super(message);
	}
}

export class UnsupportedFeatureError extends GiselleSdkError {
	name = "UnsupportedFeatureError";
}

export class NotImplementedError extends GiselleSdkError {
	name = "NotImplementedError";
}
