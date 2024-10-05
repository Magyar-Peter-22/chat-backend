import { createUser, findUser } from "../mongodb/userQueries.js";
import { setUser } from "./handleUser.js";

//try to get the user of this cookie or create a new one
async function Auth(socket, next) {
    //find the user of this session id if exists
    let user = await findSessionUser(socket);

    //if the session has no user, create one
    if (!user)
        user = await CreateUser(socket);

    //add or overwrite the user in the session
    setUser(socket, user)
    const req = socket.request;
    await req.session.save();

    socket.emit("auth", user);
    next();
}


//create a new user in the db and add it to the session
async function CreateUser(socket) {
    const req = socket.request;
    const username = `New User ${Math.round(Math.random() * 100)}`;
    const sessionId = req.session.id;
    const user = { sessionId, username };

    const created = await createUser(user);//mongodb adds the id to the object after creation
    return created;
}

async function findSessionUser(socket) {
    const req = socket.request;
    const sessionId = req.session.id;
    const user = await findUser(sessionId);
    return user;
}

export default Auth;