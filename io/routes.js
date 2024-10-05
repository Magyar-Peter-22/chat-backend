import Auth from "./auth.js";
import handleMessages from "./messages.js";
import handleRooms, { loadRooms } from "./rooms.js";
import handleUserCount from "./userCount.js";
import handleUserSettings from "./userSettings.js";

export default (io) => {
    io.use(Auth);
    io.use(loadRooms);

    io.on('connection', (socket, app) => {
        console.log("a user connected");
        handleMessages(socket, io);
        handleUserCount(socket, io);
        handleUserSettings(socket, io);
        handleRooms(socket, io);
    });

};