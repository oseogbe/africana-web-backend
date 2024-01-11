interface CustomError extends Error {
    statusCode?: number;
}

export {
    CustomError,
}