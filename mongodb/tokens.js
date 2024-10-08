import { Schema, model } from 'mongoose';

const UserTokenSchema = new Schema({
    userId: { type: mongoose.ObjectId, required: true },
    token: { type: String, required: true },
    expires:{
        type:Date,
        default:Date.now,
        expires:30*24*60*60
    }
});

const User = model("users", UserSchema);