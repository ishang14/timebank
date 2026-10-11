// Error with an HTTP status; the error handler turns it into a JSON response
export const httpError = (status, message) => Object.assign(new Error(message), { status });
