export class Rag3Error extends Error {
	constructor(
		message: string,
		public cause?: Error,
	) {
		super(message);
		this.name = "Rag3Error";
	}
}

export class ValidationError extends Rag3Error {
	constructor(
		message: string,
		public errors: unknown,
	) {
		super(message);
		this.name = "ValidationError";
	}
}

export class DatabaseError extends Rag3Error {
	constructor(message: string, cause?: Error) {
		super(message, cause);
		this.name = "DatabaseError";
	}
}

export class EmbeddingError extends Rag3Error {
	constructor(message: string, cause?: Error) {
		super(message, cause);
		this.name = "EmbeddingError";
	}
}
