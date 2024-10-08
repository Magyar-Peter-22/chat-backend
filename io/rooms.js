import { Validator } from 'node-input-validator';
import { checkV } from "../validator.js";
import { cleanWhitespaces } from "../filterText.js";
import { getUser } from './handleUser.js';
import { createRoom, getRooms, deleteRoomOfUser, isRoomValid } from '../mongodb/roomQueries.js';
import mongoose from 'mongoose';
import errorHandler from './errorHandler.js';

export default (socket, io) => {
    //join the selected room when switching between rooms on the frontend
    socket.on("join room", async (room, callback) => {
        try {
            //validate data
            const v = new Validator(
                { room },
                {
                    room: 'required|string',
                },
            );
            await checkV(v);

            //get and validate room id
            let roomId;
            try {
                roomId = new mongoose.Types.ObjectId(String(room));
            }
            catch {
                throw new Error("invalid room id");
            }

            //check if the selected room is valid
            const { ok, message } = await isRoomValid(roomId);
            if (!ok)
                throw message;

            // Join the selected room
            switchRoom(socket, room);
            console.log(`user "${getUser(socket).username}" joined room "${room}"`)

            callback(undefined);
        }
        catch (err) {
            errorHandler(callback, err);
        }
    });

    //create a new room
    socket.on("create room", async (name, callback) => {
        try {
            //validate data
            const v = new Validator(
                { name },
                {
                    name: 'required|string|maxLength:30',
                },
            );
            await checkV(v);

            //clean name
            name = cleanWhitespaces(name);

            //construct room object
            const user = getUser(socket);
            const userId = user._id;
            const newRoom = { userId, name, timestamp: Date.now() };

            //create room in db
            try {
                const created = await createRoom(newRoom);

                //success
                console.log(`user "${user.username}" created a new room "${name}"`)

                io.emit("room created", created);
                callback(undefined, created._id.toString());
            }
            catch (err) {
                //unqiue user id index error
                const duplicate = Object.keys(err.errorResponse.keyValue)[0] === "userId";
                if (duplicate) {
                    console.log(`user "${user.username}" tried to create a room but he already has one`)
                    return callback("You cannot have more than one rooms at once");
                }

                //unknown error
                throw (err);
            }
        }
        catch (err) {
            errorHandler(callback, err);
        }
    });

    //delete the room of a user
    socket.on("delete room", async (params, callback) => {
        try {
            //clean name
            const user = getUser(socket);
            const userId = user._id;
            const deleted = await deleteRoomOfUser(userId);
            if (deleted) {
                console.log(`user "${user.username}" deleted his room "${deleted.name}"`)
                io.emit("room deleted", deleted._id);
                callback(undefined, deleted);
            }
            else {
                console.log(`user "${user.username}" attempted to delete his room that does not exists`)
                callback("This room does not exists");
            }
        }
        catch (err) {
            errorHandler(callback, err);
        }
    });
};

//leave all rooms
function leaveRooms(socket) {
    //the first room is the socket id
    const rooms = [...socket.rooms];
    for (let n = 1; n < rooms.length; n++) {
        socket.leave(rooms[n]);
    }
}

//leave all rooms then join one
function switchRoom(socket, room) {
    leaveRooms(socket);
    socket.join(room);
}

//load all rooms when the chat starts
async function loadRooms(socket, next) {
    try {
        //all rooms
        const rooms = await getRooms();
        const userId = getUser(socket)._id;
        //does this user created his own room? the state of the create/delete button depends on this
        const hasRoom = rooms.find(room => room.userId.equals(userId));
        socket.emit("load rooms", { rooms, hasRoom });
        next();
    }
    catch (err) {
        next(err);
    }
}

export { loadRooms };