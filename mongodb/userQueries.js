import { Schema, model } from 'mongoose';
import "./connect.js";
import { project } from './queryUtilities.js';

const UserSchema = new Schema({
    sessionId: String,
    username: String
});

const User = model("users", UserSchema);

//the values of the user those can be shown on the client
const userProjection = {
    username: 1,
    _id: 1
}

async function createUser(user) {
    const result = (await User.create(user)).toObject();
    return project(userProjection, result);
}

async function changeName(id, username) {
    const user = await User.findOneAndUpdate(
        { _id: id },
        {
            $set: {
                username: username
            }
        },
        { new: true }
    );

    return project(userProjection, user);
}

//find user based on sessionId
async function findUser(sessionId) {
    const user = (await User.findOne({ sessionId }))?.toObject()??null;
    return project(userProjection, user);
}

export { changeName, createUser, findUser, userProjection };

