import mongoose, { Schema, model } from 'mongoose';
import "./connect.js";
import { aggregateOne } from './queryUtilities.js';
import { userProjection } from './userQueries.js';

const MessageSchema = new Schema({
    userId: {type:mongoose.ObjectId,required:true},
    text: {type:String,required:true},
    timestamp: { type: Number, default: Date.now,required:true },
    room: {type:mongoose.ObjectId,required:true},
    pending: Boolean,
    media: Array
});

//add the user to the messages based on the userId
const addUser = [
    {
        $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
            pipeline: [
                {
                    $project: userProjection
                }
            ]
        }
    },
    { $unwind: '$user' },
];

const Message = model("messages", MessageSchema);

async function insertMessage(message, user) {
    const result = (await Message.create(message)).toObject();

    //add the user object to the message
    //when selecting from the db, it is automatically added but not here
    result.user = user;

    return result;
}

//get a part of the message list in a room
async function getMessages(offset, startTime, limit, room) {
    const pipeline = [
        {
            //get the messages those were made at or before the timestamp
            $match: {
                timestamp: {
                    $lte: startTime,
                },
                room: room,
                pending: null
            }
        },
        ...addUser,
        { $sort: { timestamp: -1 } },
        //apply offset and limit
        {
            $skip: offset
        },
        {
            $limit: limit
        },
    ];

    const aggCursor = await Message.aggregate(pipeline).cursor();
    const results = await aggCursor.toArray();
    //reverse the rows, the oldest one is the first now
    return results.reverse();
}

async function getMessageById(messageId) {
    const message = await Message.findById(messageId).lean();
    return message;
}

//finalize a pending message and return it
async function finalizeMessage(messageId, files, user) {
    const result = await Message.findByIdAndUpdate(messageId,
        {
            $set: {
                pending: null,
                media: files
            }
        },
        { new: true }
    ).lean();
    result.user = user;
    return result;
}

export { insertMessage, getMessages, getMessageById, finalizeMessage };