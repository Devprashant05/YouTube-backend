class ApiError extends Error {
    constructor(
        stausCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ) {
        super(message);
        this.stausCode = stausCode;
        this.data = null; // check this field
        this.message = message;
        this.success = false;
        this.errors = errors;
        
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError };
