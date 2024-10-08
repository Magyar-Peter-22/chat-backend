import jwt from "jsonwebtoken";
import { headersToAccessToken } from "../authentication.js";
import { findUser } from "../mongodb/userQueries.js";

//try to get the user of this cookie or create a new one
async function Auth(socket, next) {
    try {
        //get access token from the headers
        const accessToken = headersToAccessToken(socket.handshake.headers);

        //auth if no token found
        if (!accessToken)
            throw new Error("no access token provided");

        //decode the token and get the user id
        const userData = await jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

        //get the user of the id
        const user = await findUser({ _id: userData._id })

        //if no user was found, the user id is invalid, auth again
        if (!user)
            throw new Error("invalid data in access token");

        //everything is ok, store the user in the request object
        socket.request.user = user;

        //send user to client
        socket.emit("auth", user);

        next();
    }
    catch (err) {
        return next(err);
    }
}

export default Auth;