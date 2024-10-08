function expressErrorHandler(err, req, res, next) {
    res.status(err.status || 500).send(err.message);
    console.log("\nerror in a request:\n");
    console.error(err);
}

function statusErrorCode(status,message, code) {
    const err = new Error(message);
    err.code = code;
    err.status = status;
    throw err;
}

function CheckErr(message, code) {
    statusErrorCode(422,message, code);
}

export { expressErrorHandler, CheckErr, statusErrorCode };