import mongoose,{ model, Schema } from 'mongoose';
import "./connect.js";

const RoomSchema = new Schema({
    userId: mongoose.ObjectId,
    name: String,
    timestamp: { type: Number, default: Date.now },
    another: Number,
    deleted: {type:Boolean,default:null}
});

const validRoom = {
    deleted: null
}

const Room = model("rooms", RoomSchema);

async function createRoom(room) {
    const result = await Room.create(room);
    return result;
}

async function deleteRoomOfUser(userId) {
    const deleted = await Room.findOneAndUpdate(
        {
            userId: userId,
            ...validRoom
        },
        {
            $set: { deleted: true },
        }
    ).lean();
    return deleted;
}

async function getRooms() {
    const results = await Room.find(validRoom).sort({ timestamp: 1 }).lean();
    return results;
}

async function isRoomValid(roomId) {
    const room = await Room.findById(roomId).lean();

    //check if exists
    if (!room)
        return { ok: false, message: "this room does not exists" };

    //check if deleted
    if (room.deleted)
        return { ok: false, message: "this room was deleted" };

    //ok
    return { ok: true };
}

export { createRoom, deleteRoomOfUser, getRooms, isRoomValid };
