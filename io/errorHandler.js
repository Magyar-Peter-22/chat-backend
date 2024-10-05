export default (callback,error) => {
    console.log("\nWebsocket error:\n");
    console.error(error);
    console.log("\n");
    callback(error.toString());
}
