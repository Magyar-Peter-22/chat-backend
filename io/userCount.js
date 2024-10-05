export default (socket,io) => {
    //request the user count. this is used when the counter gets mounted
    socket.on("user count", (callback) => {
        callback(io.engine.clientsCount);
    })

    //send user count when connecting
    socket.broadcast.emit("user count", io.engine.clientsCount);

    //send user count when disconnecting
    socket.on('disconnect', () => {
        socket.broadcast.emit("user count", io.engine.clientsCount);
        console.log("a user disconnected")
    });
}