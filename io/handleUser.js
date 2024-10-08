import mongoose from 'mongoose';

const getUser = (socket) => {
    return socket.request.user;
}

const setUser = (socket, newUser) => {
    socket.request.user = newUser;
}

function getRoom(socket) {
    return [...socket.rooms][1];
}

function getRoomId(socket) {
    const room = getRoom(socket);
    if (!room)
        return;
    return new mongoose.Types.ObjectId(String(room));
}

export { getUser, setUser, getRoom, getRoomId };

