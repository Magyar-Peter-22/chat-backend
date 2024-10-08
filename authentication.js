function headersToAccessToken(headers) {
    return headers.authorization.split(" ")[1];
}

export { headersToAccessToken }