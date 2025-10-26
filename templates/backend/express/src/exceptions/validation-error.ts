export class ValidationError extends Error {
	public statusCode = 400;
	public errors: any[];

	constructor(errors: any[]) {
		super("Validation failed");
		this.errors = errors;
	}
}
