import { Validator } from 'node-input-validator';
import { changeName } from "../mongodb/userQueries.js";
import { checkV } from "../validator.js";
import { cleanWhitespaces } from "../filterText.js";
import { getUser, setUser } from './handleUser.js';
import errorHandler from './errorHandler.js';

export default (socket, io) => {
    socket.on("change username", async (username, callback) => {
        try {
            //validate data
            const v = new Validator(
                { username },
                { username: 'required|username' },
            );
            await checkV(v);

            //clean up the whitespaces again (this also happens on client)
            username = cleanWhitespaces(username);

            //set db
            const user = getUser(socket);
            const id = user._id;
            const newUser = await changeName(id, username);

            console.log(`"${user.username}" changed his name to "${newUser.username}"`);

            //apply to session
            setUser(socket, newUser);
            await socket.request.session.save();

            //send the new user to client
            callback(undefined, newUser);

            //notify the users about the change
            io.emit("update user", id, newUser);
        }
        catch (err) {
            errorHandler(callback,err);
        }
    });
}