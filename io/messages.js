import { Validator } from 'node-input-validator';
import { getMessages, insertMessage, getMessageById, finalizeMessage } from "../mongodb/chatQueries.js";
import { checkV } from "../validator.js";
import { cleanWhitespaces } from "../filterText.js";
import { getUser, getRoom, getRoomId } from './handleUser.js';
import { createChatSignature } from './upload.js';
import errorHandler from './errorHandler.js';
import mongoose from 'mongoose';

export default (socket, io) => {
    //load the messages backwards when scrolling up
    socket.on("load messages", async (offset, startTime, more, callback) => {
        try {
            //validate data
            const v = new Validator(
                { offset, more },
                {
                    offset: 'required|integer',
                    more: "required|boolean",
                },
            );
            await checkV(v);

            //when this message list started
            //this value prevents the new messages from offsetting the list
            //the client will send it back on the next fetch
            if (!startTime)
                startTime = Date.now();

            //select only the messages of the current room of the user
            const roomId = getRoomId(socket);
            const messages = await getMessages(offset, startTime, more ? 40 : 20, roomId);

            //send the messages and pagination data to client
            callback(undefined, { messages, startTime, end: messages.length === 0 });
        }
        catch (err) {
            errorHandler(callback, err);
        }
    });

    //user submitted a message
    //send it to the other users and store it in the db
    socket.on('send message', async (data, callback) => {
        try {
            //validate data
            const v = new Validator(
                data,
                {
                    text: 'required|string',
                    fileData: "array",
                    "fileData.*": "required|object",
                    "fileData.*.name": "required|string",
                    "fileData.*.type": "required|string"
                },
            );
            let { text, fileData } = data;

            await checkV(v);
            //clean up the whitespaces
            text = cleanWhitespaces(text);

            //message value
            const user = getUser(socket);
            const userId = user._id;
            const room = getRoom(socket);
            const roomId = getRoomId(socket);
            const message = { userId, text, room: roomId };

            //if the the message contains media, make it pending and start the upload
            if (fileData && fileData.length > 0) {
                //add the value of the pending message
                message.pending = true;
                message.media = fileData;

                //add message to db
                const created = await insertMessage(message, user);

                console.log(`\n${user.username} sent a pending message to room ${room}.\nmessageId:${created._id.toString()}\nfileData: "${JSON.stringify(fileData)}"`);

                //get signatures
                const signaturesDatas = await Promise.all(fileData.map(async (fileInfo, i) => {
                    const signatureData = await createChatSignature(roomId.toString(), created._id.toString(), i, fileInfo.type);
                    return signatureData;
                }))

                console.log(`\nsignatures created for message "${created._id.toString()}":\n "${JSON.stringify(signaturesDatas)}"`);

                //send back signature to client
                callback(undefined, {
                    isPending: true,
                    signatureDatas: signaturesDatas,
                    messageId: created._id.toString()
                })
            }
            else
            //if no media, then publish the message
            {
                //add message to db
                const created = await insertMessage(message, user);
                console.log(created)

                console.log(`\n${user.username} sent a message to room ${room}`);

                //realtime update
                sendMessage(room, created, io, socket);

                //exit
                //the client will be notified about the message by the emit
                callback(undefined, {
                    isPending: false
                });
            }
        }
        catch (err) {
            errorHandler(callback, err);
        }
    });

    //remove the pending status efter the files were successfully uploaded
    socket.on("finalize message", async (data, callback) => {
        try {
            //validate data
            const v = new Validator(
                data,
                {
                    messageId: "required|string",
                    fileData: "required|array",
                    "fileData.*": "required|object",
                    "fileData.*.name": "required|string",
                    "fileData.*.type": "required|string"
                },
            );
            await checkV(v);
            const { messageId, fileData } = data;

            console.log(`\nfinalizing pending message "${messageId}"`);

            //parse the message id
            let messageIdParsed;
            try {
                messageIdParsed = new mongoose.Types.ObjectId(String(messageId));
            }
            catch {
                throw (new Error("invalid message id"));
            }

            //get the pending message
            const pendingMessage = await getMessageById(messageIdParsed);
            if (!pendingMessage)
                throw new Error(`attempted to finalize a message that does not exists at id "${messageId}"`);

            //compare the response of the uploaded files with the filedata that was used to generate the signatures
            const requested = pendingMessage.media;
            const uploaded = fileData;
            console.log(`\nverifying the media of message "${messageId}". \nrequested: ${JSON.stringify(requested)} \nuploaded: ${JSON.stringify(uploaded)}`);
            //check length
            if (requested.length !== uploaded.length)
                throw new Error("the lenght of the 2 arrays is not equal");

            //the files are verified now, remove the pending status and add the new files
            const updated = await finalizeMessage(messageIdParsed, uploaded, getUser(socket));
            console.log(`message "${messageId}" was finalized successfully`);

            //realtime update
            sendMessage(updated.room.toString(), updated, io, socket);

            callback(undefined);
        }
        catch (err) {
            errorHandler(callback, err);
        }
    });
}


//send a message and it's notifcations
function sendMessage(room, message, io, socket) {
    //send the message to the room
    io.to(room).emit('get message', message);

    //notification for the users outside the room
    socket.broadcast.except(room).emit("alert", room);
}